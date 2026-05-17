import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEffectiveUnitPrice } from "@/lib/commerce";

const cartCookie = "adakan_cart";

async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  let id = cookieStore.get(cartCookie)?.value;

  if (!id) {
    id = crypto.randomUUID();
    cookieStore.set(cartCookie, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return id;
}

export async function getCart() {
  const session = await getSession();
  const sessionId = session ? undefined : await getOrCreateCartSessionId();
  const where = session ? { userId: session.userId } : { sessionId };

  let cart = await prisma.cart.findFirst({
    where,
    include: { items: { include: { product: { include: { images: true, brand: true } } } } }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: where,
      include: { items: { include: { product: { include: { images: true, brand: true } } } } }
    });
  }

  return cart;
}

export async function calculateCartTotals(cartId: string, couponCode?: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } }
  });

  if (!cart) throw new Error("Sepet bulunamadi");

  let subtotal = 0;
  for (const item of cart.items) {
    if (!item.product.isActive) throw new Error(`${item.product.name} artik aktif degil`);
    if (item.quantity > item.product.stock) {
      throw new Error(`${item.product.name} icin stok yetersiz`);
    }
    subtotal += getEffectiveUnitPrice(item.product) * item.quantity;
  }

  let discountTotal = 0;
  const normalizedCoupon = couponCode?.trim() || cart.couponCode || undefined;
  if (normalizedCoupon) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: normalizedCoupon,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }]
      }
    });

    if (!coupon) {
      throw new Error("Kupon gecersiz veya suresi dolmus");
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new Error("Kupon minimum sepet tutarina ulasmadi");
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Kupon kullanim limitine ulasildi");
    }

    if (coupon.discountAmount) {
      discountTotal = Number(coupon.discountAmount);
    } else if (coupon.discountPercent) {
      discountTotal = (subtotal * coupon.discountPercent) / 100;
    }
    discountTotal = Math.min(discountTotal, subtotal);
  }

  const settings = await prisma.siteSettings.findFirst();
  const discountedSubtotal = Math.max(subtotal - discountTotal, 0);
  const shippingFee =
    settings?.freeShippingThreshold && discountedSubtotal >= Number(settings.freeShippingThreshold)
      ? 0
      : Number(settings?.shippingFee ?? 0);

  return {
    subtotal,
    discountTotal,
    shippingTotal: shippingFee,
    grandTotal: discountedSubtotal + shippingFee
  };
}
