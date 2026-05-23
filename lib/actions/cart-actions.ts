"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { calculateCartTotals, getCart, getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
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

async function getActiveCartId() {
  const cart = await getCart();
  return cart.id || null;
}

export async function addToCartAction(
  productId: string,
  quantity = 1
): Promise<ActionResult<{ cartId: string }>> {
  const parsed = cartQuantitySchema.safeParse({ productId, quantity });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Sepet istegi gecersiz");
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.isActive) {
    return actionError("Urun su anda sepete eklenemiyor");
  }

  if (product.stock < parsed.data.quantity) {
    return actionError("Secilen adet icin yeterli stok yok");
  }

  const cart = await getOrCreateCart();
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: parsed.data.productId
      }
    }
  });

  const nextQuantity = (existingItem?.quantity ?? 0) + parsed.data.quantity;
  if (nextQuantity > product.stock) {
    return actionError("Sepetteki toplam adet stoktan fazla olamaz");
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: parsed.data.productId
      }
    },
    create: {
      cartId: cart.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity
    },
    update: {
      quantity: nextQuantity
    }
  });

  revalidateCartSurface();
  return actionSuccess({ cartId: cart.id }, "Urun sepete eklendi");
}

export async function updateCartItemQuantityAction(
  formData: FormData
): Promise<ActionResult<{ itemId: string; quantity: number }>> {
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
    include: { product: true }
  });

  if (!item) {
    return actionError("Sepet urunu bulunamadi");
  }

  if (!item.product.isActive) {
    return actionError("Bu urun artik aktif degil");
  }

  if (parsed.data.quantity > item.product.stock) {
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
