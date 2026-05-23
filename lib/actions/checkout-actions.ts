"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCart, calculateCartTotals } from "@/lib/cart";
import { requireUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { getEffectiveUnitPrice } from "@/lib/commerce";

export async function checkoutAction(formData: FormData) {
  const user = await requireUser();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Gecersiz checkout");
  }

  const normalizedCouponCode = parsed.data.couponCode?.trim().toUpperCase() || undefined;
  const cart = await getCart();
  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, brand: true }
          }
        }
      }
    }
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

  const totals = await calculateCartTotals(cart.id, normalizedCouponCode);
  const order = await prisma.$transaction(async (tx) => {
    let couponCode: string | undefined;
    const now = new Date();

    if (normalizedCouponCode) {
      const coupon = await tx.coupon.findFirst({
        where: {
          code: normalizedCouponCode,
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
        }
      });

      if (!coupon) throw new Error("Kupon gecersiz veya suresi dolmus");
      if (coupon.minOrderAmount && totals.subtotal < Number(coupon.minOrderAmount)) {
        throw new Error("Kupon minimum sepet tutarina ulasmadi");
      }

      couponCode = coupon.code;

      if (coupon.usageLimit) {
        const updatedCoupon = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            usedCount: { lt: coupon.usageLimit }
          },
          data: { usedCount: { increment: 1 } }
        });

        if (updatedCoupon.count === 0) {
          throw new Error("Kupon kullanim limitine ulasildi");
        }
      } else {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    }

    for (const item of fullCart.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive || product.stock < item.quantity) {
        throw new Error("Stok veya urun durumu degisti");
      }

      const nextStock = product.stock - item.quantity;
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } }
      });

      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          change: -item.quantity,
          stockAfter: nextStock,
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
        couponCode,
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
          create: fullCart.items.map((item) => {
            const unitPrice = getEffectiveUnitPrice(item.product);
            return {
              productId: item.productId,
              productName: item.product.name,
              productSlug: item.product.slug,
              productImage: item.product.images[0]?.url,
              productBrand: item.product.brand?.name,
              sku: item.product.sku,
              unitPrice,
              quantity: item.quantity,
              lineTotal: unitPrice * item.quantity
            };
          })
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

    await tx.cart.update({
      where: { id: fullCart.id },
      data: { couponCode: null }
    });
    await tx.cartItem.deleteMany({ where: { cartId: fullCart.id } });
    return created;
  });

  redirect(`/orders/${order.id}/success`);
}
