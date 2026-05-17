import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const cartCookie = "adakan_cart";

function getOrCreateCartSessionId() {
  let id = cookies().get(cartCookie)?.value;
  if (!id) {
    id = crypto.randomUUID();
    cookies().set(cartCookie, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return id;
}

export async function getCart() {
  const session = await getSession();
  const sessionId = session ? undefined : getOrCreateCartSessionId();
  const where = session ? { userId: session.userId } : { sessionId };
  let cart = await prisma.cart.findFirst({ where, include: { items: { include: { product: { include: { images: true } } } } } });
  if (!cart) cart = await prisma.cart.create({ data: where, include: { items: { include: { product: { include: { images: true } } } } } });
  return cart;
}

export async function calculateCartTotals(cartId: string) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: { include: { product: true } } } });
  if (!cart) throw new Error("Sepet bulunamadı");
  let subtotal = 0;
  for (const item of cart.items) {
    if (!item.product.isActive) throw new Error(`${item.product.name} artık aktif değil`);
    if (item.quantity > item.product.stock) throw new Error(`${item.product.name} için stok yetersiz`);
    subtotal += Number(item.product.price) * item.quantity;
  }
  const settings = await prisma.siteSettings.findFirst();
  const shippingFee = settings?.freeShippingThreshold && subtotal >= Number(settings.freeShippingThreshold) ? 0 : Number(settings?.shippingFee ?? 0);
  return { subtotal, discountTotal: 0, shippingTotal: shippingFee, grandTotal: subtotal + shippingFee };
}
