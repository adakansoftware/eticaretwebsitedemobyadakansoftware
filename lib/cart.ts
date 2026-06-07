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

function buildCartItemKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? "base"}`;
}

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
  const existingCart = await prisma.cart.findFirst({
    where,
    include: cartInclude
  });

  if (existingCart) {
    return existingCart;
  }

  try {
    return await prisma.cart.create({
      data: where,
      include: cartInclude
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.cart.findFirstOrThrow({
        where,
        include: cartInclude
      });
    }

    throw error;
  }
}

export async function mergeSessionCartIntoUserCart(userId: string) {
  const sessionId = await readCartSessionId();
  if (!sessionId) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      const [guestCart, userCart] = await Promise.all([
        tx.cart.findFirst({
          where: { sessionId },
          include: cartInclude
        }),
        tx.cart.findFirst({
          where: { userId },
          include: cartInclude
        })
      ]);

      if (!guestCart || guestCart.userId === userId) {
        return;
      }

      if (!userCart) {
        await tx.cart.update({
          where: { id: guestCart.id },
          data: {
            userId,
            sessionId: null
          }
        });
        return;
      }

      const userItemsByKey = new Map(
        userCart.items.map((item) => [buildCartItemKey(item.productId, item.variantId), item])
      );

      for (const guestItem of guestCart.items) {
        const itemKey = buildCartItemKey(guestItem.productId, guestItem.variantId);
        const matchingUserItem = userItemsByKey.get(itemKey);
        const stockLimit = guestItem.variant?.stock ?? guestItem.product.stock;
        const mergedQuantity = Math.min(
          (matchingUserItem?.quantity ?? 0) + guestItem.quantity,
          Math.max(stockLimit, 0)
        );

        if (mergedQuantity <= 0) {
          continue;
        }

        if (matchingUserItem) {
          await tx.cartItem.update({
            where: { id: matchingUserItem.id },
            data: { quantity: mergedQuantity }
          });
          continue;
        }

        const createdItem = await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: mergedQuantity
          }
        });

        userItemsByKey.set(itemKey, {
          ...guestItem,
          id: createdItem.id,
          cartId: userCart.id,
          quantity: mergedQuantity,
          createdAt: createdItem.createdAt,
          updatedAt: createdItem.updatedAt
        });
      }

      await tx.cart.update({
        where: { id: userCart.id },
        data: {
          couponCode: userCart.couponCode ?? guestCart.couponCode ?? null
        }
      });

      await tx.cart.delete({
        where: { id: guestCart.id }
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
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

export async function getCartItemCount() {
  const cart = await getCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
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
