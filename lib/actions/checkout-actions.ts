"use server";

import { redirect } from "next/navigation";
import { sendAdminNewOrderEmail } from "@/lib/emails/admin-new-order";
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getCart, calculateCartTotals } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { getVariantUnitPrice } from "@/lib/commerce";
import { createGuestOrderAccessToken } from "@/lib/order-access";
import { getSiteSettings } from "@/lib/site-settings";

export async function checkoutAction(formData: FormData) {
  const user = await getCurrentUser();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Gecersiz checkout");
  }

  const isGuestCheckout = !user;
  const normalizedCouponCode = parsed.data.couponCode?.trim().toUpperCase() || undefined;
  const cart = await getCart();
  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, brand: true }
          },
          variant: true
        }
      }
    }
  });

  if (!fullCart || fullCart.items.length === 0) {
    throw new Error("Sepet bos");
  }

  const address = !isGuestCheckout && user
    ? await prisma.address.findFirst({
        where: { id: parsed.data.addressId, userId: user.id }
      })
    : null;
  if (!isGuestCheckout && !address) {
    throw new Error("Adres bulunamadi");
  }

  const shippingSnapshot = isGuestCheckout
    ? {
        guestEmail: parsed.data.guestEmail!,
        guestName: parsed.data.guestName!,
        addressId: null,
        shippingFullName: parsed.data.guestName!,
        shippingPhone: parsed.data.guestPhone!,
        shippingCity: parsed.data.guestCity!,
        shippingDistrict: parsed.data.guestDistrict!,
        shippingAddress: parsed.data.guestAddress!
      }
    : {
        guestEmail: null,
        guestName: null,
        addressId: address!.id,
        shippingFullName: address!.fullName,
        shippingPhone: address!.phone,
        shippingCity: address!.city,
        shippingDistrict: address!.district,
        shippingAddress: address!.address
      };

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
      if (!product || !product.isActive) {
        throw new Error("Stok veya urun durumu degisti");
      }

      const variant = item.variant
        ? await tx.productVariant.findFirst({
            where: { id: item.variant.id, productId: item.productId }
          })
        : null;

      if (item.variant && (!variant || variant.stock < item.quantity)) {
        throw new Error("Secilen varyantin stogu degisti");
      }

      if (!variant && product.stock < item.quantity) {
        throw new Error("Stok veya urun durumu degisti");
      }

      const nextStock = (variant?.stock ?? product.stock) - item.quantity;
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } }
        });
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

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
        userId: user?.id ?? null,
        couponCode,
        status: parsed.data.paymentMethod === "BANK_TRANSFER" ? "WAITING_PAYMENT" : "PENDING",
        paymentMethod: parsed.data.paymentMethod,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingTotal: totals.shippingTotal,
        grandTotal: totals.grandTotal,
        customerNote: parsed.data.customerNote,
        ...shippingSnapshot,
        items: {
          create: fullCart.items.map((item) => {
            const unitPrice = getVariantUnitPrice(item.product, item.variant);
            const variantLabel = item.variant ? ` (${item.variant.name}: ${item.variant.value})` : "";
            return {
              productId: item.productId,
              productName: `${item.product.name}${variantLabel}`,
              productSlug: item.product.slug,
              productImage: item.product.images[0]?.url,
              productBrand: item.product.brand?.name,
              sku: item.variant?.sku ?? item.product.sku,
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

  const settings = await getSiteSettings();
  const customerEmail = user?.email ?? shippingSnapshot.guestEmail ?? null;
  const customerName = user?.name ?? shippingSnapshot.guestName ?? shippingSnapshot.shippingFullName;
  const lineItems = fullCart.items.map((item) => ({
    name: `${item.product.name}${item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ""}`,
    quantity: item.quantity,
    unitPrice: getVariantUnitPrice(item.product, item.variant),
    lineTotal: getVariantUnitPrice(item.product, item.variant) * item.quantity
  }));

  if (customerEmail) {
    try {
      await sendOrderConfirmationEmail({
        email: customerEmail,
        customerName,
        orderNumber: order.orderNumber,
        items: lineItems,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingTotal: totals.shippingTotal,
        grandTotal: totals.grandTotal,
        shippingFullName: shippingSnapshot.shippingFullName,
        shippingPhone: shippingSnapshot.shippingPhone,
        shippingCity: shippingSnapshot.shippingCity,
        shippingDistrict: shippingSnapshot.shippingDistrict,
        shippingAddress: shippingSnapshot.shippingAddress,
        paymentMethod: parsed.data.paymentMethod,
        bankAccountInfo: settings?.bankAccountInfo,
        siteName: settings?.siteName ?? "Adakan Commerce"
      });
    } catch (error) {
      console.error("Siparis onay e-postasi gonderilemedi", {
        orderId: order.id,
        error
      });
    }
  }

  if (settings?.email) {
    try {
      await sendAdminNewOrderEmail({
        email: settings.email,
        orderNumber: order.orderNumber,
        customerName,
        grandTotal: totals.grandTotal,
        paymentMethod: parsed.data.paymentMethod,
        siteName: settings.siteName,
        adminOrderUrl: `${env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`
      });
    } catch (error) {
      console.error("Admin yeni siparis e-postasi gonderilemedi", {
        orderId: order.id,
        error
      });
    }
  }

  if (order.userId) {
    redirect(`/orders/${order.id}/success`);
  }

  const accessToken = await createGuestOrderAccessToken(order.id);
  redirect(`/orders/${order.id}/success?access=${encodeURIComponent(accessToken)}`);
}
