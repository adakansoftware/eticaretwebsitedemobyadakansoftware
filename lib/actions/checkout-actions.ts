"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCart, calculateCartTotals } from "@/lib/cart";
import { buildCheckoutReplayKey } from "@/lib/checkout-replay";
import { getVariantUnitPrice } from "@/lib/commerce";
import { sendAdminNewOrderEmail } from "@/lib/emails/admin-new-order";
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { env } from "@/lib/env";
import { logError } from "@/lib/logger";
import { createGuestOrderAccessToken } from "@/lib/order-access";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
import { getSiteSettings } from "@/lib/site-settings";
import { checkoutSchema } from "@/lib/validators";

export async function processCheckout(formData: FormData) {
  await assertTrustedMutation("checkout:create");

  const user = await getCurrentUser();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Gecersiz checkout");
  }

  const fingerprint = await getRequestFingerprint();
  await enforceRateLimit({
    scope: "checkout:create",
    key: `${user?.id ?? "guest"}|${fingerprint}`,
    limit: 6,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla checkout denemesi algilandi. Lutfen biraz sonra tekrar deneyin."
  });

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
  const replayKey = buildCheckoutReplayKey({
    cartId: fullCart.id,
    userId: user?.id ?? null,
    addressId: shippingSnapshot.addressId,
    guestEmail: shippingSnapshot.guestEmail,
    paymentMethod: parsed.data.paymentMethod,
    couponCode: normalizedCouponCode ?? null,
    customerNote: parsed.data.customerNote ?? null,
    items: fullCart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      updatedAt: item.updatedAt
    }))
  });

  const order = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const replayWindowMs = env.ORDER_REPLAY_WINDOW_MINUTES * 60 * 1000;
    let couponCode: string | undefined;

    try {
      await tx.operationReplayGuard.create({
        data: {
          scope: "checkout:create",
          key: replayKey,
          expiresAt: new Date(now.getTime() + replayWindowMs),
          metadata: {
            cartId: fullCart.id,
            userId: user?.id ?? null
          }
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingReplay = await tx.operationReplayGuard.findUnique({
          where: {
            scope_key: {
              scope: "checkout:create",
              key: replayKey
            }
          }
        });

        if (existingReplay?.entityId) {
          const existingOrder = await tx.order.findUnique({
            where: { id: existingReplay.entityId }
          });

          if (existingOrder) {
            return existingOrder;
          }
        }

        throw new Error("Checkout istegi zaten isleniyor. Lutfen sayfayi yenileyip tekrar kontrol et.");
      }

      throw error;
    }

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

      if (variant) {
        const updatedVariant = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            productId: item.productId,
            stock: { gte: item.quantity }
          },
          data: { stock: { decrement: item.quantity } }
        });

        if (updatedVariant.count === 0) {
          throw new Error("Secilen varyantin stogu degisti");
        }

        const currentVariant = await tx.productVariant.findUnique({
          where: { id: variant.id },
          select: { stock: true }
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            change: -item.quantity,
            stockAfter: currentVariant?.stock ?? null,
            reason: "ORDER_CREATED",
            note: `Checkout ile siparis olusturuldu (varyant: ${variant.name}=${variant.value})`
          }
        });
      } else {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: product.id,
            isActive: true,
            stock: { gte: item.quantity }
          },
          data: { stock: { decrement: item.quantity } }
        });

        if (updatedProduct.count === 0) {
          throw new Error("Stok veya urun durumu degisti");
        }

        const currentProduct = await tx.product.findUnique({
          where: { id: product.id },
          select: { stock: true }
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            change: -item.quantity,
            stockAfter: currentProduct?.stock ?? null,
            reason: "ORDER_CREATED",
            note: "Checkout ile siparis olusturuldu"
          }
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber: `ADK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
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
              variantId: item.variant?.id ?? null,
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

    await tx.operationReplayGuard.update({
      where: {
        scope_key: {
          scope: "checkout:create",
          key: replayKey
        }
      },
      data: {
        entityId: created.id,
        expiresAt: new Date(now.getTime() + replayWindowMs),
        metadata: {
          cartId: fullCart.id,
          orderNumber: created.orderNumber,
          userId: user?.id ?? null
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

  const customerEmail = user?.email ?? shippingSnapshot.guestEmail ?? null;
  const customerName = user?.name ?? shippingSnapshot.guestName ?? shippingSnapshot.shippingFullName;
  const lineItems = fullCart.items.map((item) => ({
    name: `${item.product.name}${item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ""}`,
    quantity: item.quantity,
    unitPrice: getVariantUnitPrice(item.product, item.variant),
    lineTotal: getVariantUnitPrice(item.product, item.variant) * item.quantity
  }));

  void (async () => {
    const settings = await getSiteSettings();

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
        await logError("checkout.customer_email_failed", error, {
          orderId: order.id,
          customerEmail
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
        await logError("checkout.admin_email_failed", error, {
          orderId: order.id,
          adminEmail: settings.email
        });
      }
    }
  })();

  if (order.userId) {
    return `/orders/${order.id}/success`;
  }

  const accessToken = await createGuestOrderAccessToken(order.id);
  return `/orders/${order.id}/success?access=${encodeURIComponent(accessToken)}`;
}

export async function checkoutAction(formData: FormData) {
  redirect(await processCheckout(formData));
}
