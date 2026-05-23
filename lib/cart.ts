import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { getSession } from "@/lib/auth";
import { getVariantUnitPrice } from "@/lib/commerce";

const cartCookie = "adakan_cart";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
          brand: true
        }
      },
      variant: true
    }
  }
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function createEmptyCart(): CartWithItems {
  return {
    id: "",
    userId: null,
    sessionId: null,
    couponCode: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    items: []
  };
}

export async function readCartSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(cartCookie)?.value ?? null;
}

export async function getOrCreateCartSessionId() {
  const cookieStore = await cookies();
  let id = cookieStore.get(cartCookie)?.value;

  if (!id) {
    id = crypto.randomUUID();
    cookieStore.set(cartCookie, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return id;
}

async function findOrCreateCart(where: { userId: string } | { sessionId: string }) {
  let cart = await prisma.cart.findFirst({
    where,
    include: cartInclude
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: where,
      include: cartInclude
    });
  }

  return cart;
}

export async function getCart(): Promise<CartWithItems> {
  const session = await getSession();

  if (session) {
    return findOrCreateCart({ userId: session.userId });
  }

  const sessionId = await readCartSessionId();
  if (!sessionId) {
    return createEmptyCart();
  }

  return findOrCreateCart({ sessionId });
}

export async function getOrCreateCart(): Promise<CartWithItems> {
  const session = await getSession();

  if (session) {
    return findOrCreateCart({ userId: session.userId });
  }

  const sessionId = await getOrCreateCartSessionId();
  return findOrCreateCart({ sessionId });
}

export async function calculateCartTotals(cartId?: string, couponCode?: string) {
  if (!cartId) {
    return {
      subtotal: 0,
      discountTotal: 0,
      shippingTotal: 0,
      grandTotal: 0
    };
  }

  const fullCart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } } }
  });

  if (!fullCart) {
    return {
      subtotal: 0,
      discountTotal: 0,
      shippingTotal: 0,
      grandTotal: 0
    };
  }

  let subtotal = 0;
  for (const item of fullCart.items) {
    if (!item.product.isActive) throw new Error(`${item.product.name} artik aktif degil`);
    const availableStock = item.variant?.stock ?? item.product.stock;
    if (item.variant && item.variant.productId !== item.productId) {
      throw new Error(`${item.product.name} varyanti gecersiz`);
    }
    if (item.quantity > availableStock) {
      throw new Error(`${item.product.name} icin stok yetersiz`);
    }
    subtotal += getVariantUnitPrice(item.product, item.variant) * item.quantity;
  }

  let discountTotal = 0;
  const normalizedCoupon = couponCode?.trim() || fullCart.couponCode || undefined;
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

  const settings = await getSiteSettings();
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
