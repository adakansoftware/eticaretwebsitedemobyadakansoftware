"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCart, calculateCartTotals } from "@/lib/cart";
import { requireUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";

export async function checkoutAction(formData: FormData) {
  const user = await requireUser();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Gecersiz checkout");
  }

  const cart = await getCart();
  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } }
  });

  if (!fullCart || fullCart.items.length === 0) {
    throw new Error("Sepet bos");
  }

  const address = await prisma.address.findFirst({
    where: { id: parsed.data.addressId, userId: user.id }
  });
  if (!address) {
    throw new Error("Adres bulunamadi");
  }

  const totals = await calculateCartTotals(cart.id);
  const order = await prisma.$transaction(async (tx) => {
    for (const item of fullCart.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive || product.stock < item.quantity) {
        throw new Error("Stok veya urun durumu degisti");
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } }
      });

      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          change: -item.quantity,
          reason: "ORDER_CREATED",
          note: "Checkout ile siparis olusturuldu"
        }
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber: `ADK-${Date.now()}`,
        userId: user.id,
        addressId: address.id,
        status: parsed.data.paymentMethod === "BANK_TRANSFER" ? "WAITING_PAYMENT" : "PENDING",
        paymentMethod: parsed.data.paymentMethod,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingTotal: totals.shippingTotal,
        grandTotal: totals.grandTotal,
        customerNote: parsed.data.customerNote,
        shippingFullName: address.fullName,
        shippingPhone: address.phone,
        shippingCity: address.city,
        shippingDistrict: address.district,
        shippingAddress: address.address,
        items: {
          create: fullCart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitPrice: item.product.price,
            quantity: item.quantity,
            lineTotal: Number(item.product.price) * item.quantity
          }))
        },
        payment: {
          create: {
            method: parsed.data.paymentMethod,
            status: "WAITING",
            amount: totals.grandTotal
          }
        }
      }
    });

    await tx.cartItem.deleteMany({ where: { cartId: fullCart.id } });
    return created;
  });

  redirect(`/orders/${order.id}/success`);
}
