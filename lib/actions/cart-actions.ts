"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { calculateCartTotals, getCart, getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { assertTrustedMutation } from "@/lib/security";
import {
  cartItemIdSchema,
  cartItemUpdateSchema,
  cartQuantitySchema,
  couponCodeSchema
} from "@/lib/validators";

function revalidateCartSurface() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

async function upsertCartLineQuantity(
  cartId: string,
  productId: string,
  variantId: string | null,
  incrementBy: number,
  stockLimit: number
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId
      }
    });

    const nextQuantity = (existingItem?.quantity ?? 0) + incrementBy;
    if (nextQuantity > stockLimit) {
      throw new Error("Sepetteki toplam adet stoktan fazla olamaz");
    }

    if (existingItem) {
      const updated = await prisma.cartItem.updateMany({
        where: {
          id: existingItem.id,
          quantity: existingItem.quantity
        },
        data: {
          quantity: nextQuantity
        }
      });

      if (updated.count > 0) {
        return;
      }

      continue;
    }

    try {
      await prisma.cartItem.create({
        data: {
          cartId,
          productId,
          variantId,
          quantity: incrementBy
        }
      });
      return;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Sepet satiri guncellenirken eszamanli bir cakisma olustu. Lutfen tekrar dene.");
}

async function getActiveCartId() {
  const cart = await getCart();
  return cart.id || null;
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
  variantId?: string
): Promise<ActionResult<{ cartId: string }>> {
  await assertTrustedMutation("cart:add");
  const parsed = cartQuantitySchema.safeParse({ productId, quantity, variantId });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Sepet istegi gecersiz");
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.isActive) {
    return actionError("Urun su anda sepete eklenemiyor");
  }

  const variant = parsed.data.variantId
    ? await prisma.productVariant.findFirst({
        where: {
          id: parsed.data.variantId,
          productId: parsed.data.productId
        }
      })
    : null;

  if (parsed.data.variantId && !variant) {
    return actionError("Secilen varyant bulunamadi");
  }

  if (variant && variant.stock < parsed.data.quantity) {
    return actionError("Secilen varyant icin yeterli stok yok");
  }

  if (!variant && product.stock < parsed.data.quantity) {
    return actionError("Secilen adet icin yeterli stok yok");
  }

  const cart = await getOrCreateCart();
  const stockLimit = variant?.stock ?? product.stock;

  try {
    await upsertCartLineQuantity(
      cart.id,
      parsed.data.productId,
      variant?.id ?? null,
      parsed.data.quantity,
      stockLimit
    );
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Sepet satiri guncellenemedi"
    );
  }

  revalidateCartSurface();
  return actionSuccess({ cartId: cart.id }, "Urun sepete eklendi");
}

export async function updateCartItemQuantityAction(
  formData: FormData
): Promise<ActionResult<{ itemId: string; quantity: number }>> {
  await assertTrustedMutation("cart:update");
  const parsed = cartItemUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Sepet guncellenemedi");
  }

  const cartId = await getActiveCartId();
  if (!cartId) {
    return actionError("Aktif sepet bulunamadi");
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: parsed.data.itemId, cartId },
    include: { product: true, variant: true }
  });

  if (!item) {
    return actionError("Sepet urunu bulunamadi");
  }

  if (!item.product.isActive) {
    return actionError("Bu urun artik aktif degil");
  }

  const availableStock = item.variant?.stock ?? item.product.stock;
  if (parsed.data.quantity > availableStock) {
    return actionError("Guncel stok bu adet icin yeterli degil");
  }

  await prisma.cartItem.update({
    where: { id: parsed.data.itemId },
    data: { quantity: parsed.data.quantity }
  });

  revalidateCartSurface();
  return actionSuccess(
    { itemId: parsed.data.itemId, quantity: parsed.data.quantity },
    "Sepet guncellendi"
  );
}

export async function removeCartItemAction(
  formData: FormData
): Promise<ActionResult<{ itemId: string }>> {
  await assertTrustedMutation("cart:remove");
  const parsed = cartItemIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Sepet urunu silinemedi");
  }

  const cartId = await getActiveCartId();
  if (!cartId) {
    return actionError("Aktif sepet bulunamadi");
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: parsed.data.itemId, cartId },
    select: { id: true }
  });
  if (!item) {
    return actionError("Sepet urunu bulunamadi");
  }

  await prisma.cartItem.delete({
    where: { id: item.id }
  });

  revalidateCartSurface();
  return actionSuccess({ itemId: parsed.data.itemId }, "Urun sepetten kaldirildi");
}

export async function clearCartAction(): Promise<ActionResult<{ cartId: string }>> {
  await assertTrustedMutation("cart:clear");
  const cart = await getCart();
  if (!cart.id) {
    return actionSuccess({ cartId: "" }, "Sepet zaten bos");
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: null }
  });

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id }
  });

  revalidateCartSurface();
  return actionSuccess({ cartId: cart.id }, "Sepet temizlendi");
}

export async function applyCouponAction(
  formData: FormData
): Promise<ActionResult<{ cartId: string; couponCode?: string }>> {
  await assertTrustedMutation("cart:coupon");
  const parsed = couponCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Kupon kodu gecersiz");
  }

  const cart = await getOrCreateCart();
  const couponCode = parsed.data.couponCode;

  if (!couponCode) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null }
    });
    revalidateCartSurface();
    return actionSuccess({ cartId: cart.id }, "Kupon kaldirildi");
  }

  await calculateCartTotals(cart.id, couponCode);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode }
  });

  revalidateCartSurface();
  return actionSuccess({ cartId: cart.id, couponCode }, "Kupon sepete uygulandi");
}

export async function updateCartItemQuantityFormAction(formData: FormData): Promise<void> {
  const result = await updateCartItemQuantityAction(formData);
  if (!result.success) throw new Error(result.message);
}

export async function removeCartItemFormAction(formData: FormData): Promise<void> {
  const result = await removeCartItemAction(formData);
  if (!result.success) throw new Error(result.message);
}

export async function clearCartFormAction(): Promise<void> {
  const result = await clearCartAction();
  if (!result.success) throw new Error(result.message);
}

export async function applyCouponFormAction(formData: FormData): Promise<void> {
  const result = await applyCouponAction(formData);
  if (!result.success) throw new Error(result.message);
}
