"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";

export async function addToCartAction(productId: string, quantity = 1) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new Error("Ürün aktif değil");
  if (product.stock < quantity) throw new Error("Stok yetersiz");
  const cart = await getCart();
  const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
  const nextQty = (existing?.quantity ?? 0) + quantity;
  if (nextQty > product.stock) throw new Error("Stok yetersiz");
  await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, create: { cartId: cart.id, productId, quantity }, update: { quantity: nextQty } });
  revalidatePath("/cart");
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  if (quantity < 1) return removeCartItemAction(itemId);
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { product: true } });
  if (!item) throw new Error("Sepet ürünü bulunamadı");
  if (quantity > item.product.stock) throw new Error("Stok yetersiz");
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  revalidatePath("/cart");
}

export async function removeCartItemAction(itemId: string) { await prisma.cartItem.delete({ where: { id: itemId } }); revalidatePath("/cart"); }
export async function clearCartAction() { const cart = await getCart(); await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }); revalidatePath("/cart"); }
