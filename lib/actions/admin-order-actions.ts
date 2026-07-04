"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdminPermission, adminPermissions } from "@/lib/auth";
import {
  ensureOrderStatusTransition,
  shouldQueueOrderStatusNotification,
  shouldRestoreInventoryForStatusChange,
  validateShippingTransition
} from "@/lib/order-lifecycle-core";
import { outboxEventTypes, enqueueOutboxEvent } from "@/lib/outbox";
import { buildOrderStatusAfterManualPaymentConfirmation } from "@/lib/payment-method-core";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
import { orderAdminSchema } from "@/lib/validators";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateAdminOrderAction(formData: FormData) {
  await assertTrustedMutation("admin:order-update");
  const admin = await requireAdminPermission(adminPermissions.ordersWrite);
  await enforceRateLimit({
    scope: "admin:order-update",
    key: admin.id,
    limit: 50,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla siparis guncellemesi yapildi. Lutfen biraz sonra tekrar deneyin."
  });

  const parsed = orderAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Siparis verisi gecersiz");
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payment: true, items: true, user: true }
  });

  if (!order) {
    throw new Error("Siparis bulunamadi");
  }

  ensureOrderStatusTransition(order.status, parsed.data.status);
  validateShippingTransition({
    status: parsed.data.status,
    trackingNumber: parsed.data.trackingNumber ?? null,
    trackingCarrier: parsed.data.trackingCarrier ?? null
  });

  const shouldSendStatusEmail = shouldQueueOrderStatusNotification({
    previousStatus: order.status,
    nextStatus: parsed.data.status,
    previousTrackingNumber: order.trackingNumber,
    previousTrackingCarrier: order.trackingCarrier,
    nextTrackingNumber: parsed.data.trackingNumber ?? null,
    nextTrackingCarrier: parsed.data.trackingCarrier ?? null,
    recipientEmail: order.user?.email ?? order.guestEmail
  });

  await prisma.$transaction(async (tx) => {
    let inventoryRestoredAt = order.inventoryRestoredAt;

    if (shouldRestoreInventoryForStatusChange(order.status, parsed.data.status, order.inventoryRestoredAt)) {
      for (const item of order.items) {
        if (item.variantId) {
          const restoredVariant = await tx.productVariant.updateMany({
            where: { id: item.variantId, productId: item.productId },
            data: { stock: { increment: item.quantity } }
          });

          if (restoredVariant.count > 0) {
            const currentVariant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { stock: true }
            });

            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                change: item.quantity,
                stockAfter: currentVariant?.stock ?? null,
                reason: parsed.data.status === "REFUNDED" ? "RETURNED" : "ORDER_CANCELLED",
                note:
                  parsed.data.status === "REFUNDED"
                    ? `Iade ile varyant stogu geri yuklendi: ${order.orderNumber}`
                    : `Siparis iptali ile varyant stogu geri yuklendi: ${order.orderNumber}`
              }
            });

            continue;
          }
        }

        const updatedProduct = await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        if (updatedProduct.count === 0) {
          continue;
        }

        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true }
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            change: item.quantity,
            stockAfter: currentProduct?.stock ?? null,
            reason: parsed.data.status === "REFUNDED" ? "RETURNED" : "ORDER_CANCELLED",
            note:
              parsed.data.status === "REFUNDED"
                ? `Iade ile stok geri yuklendi: ${order.orderNumber}`
                : `Siparis iptali ile stok geri yuklendi: ${order.orderNumber}`
          }
        });
      }

      inventoryRestoredAt = new Date();
    }

    await tx.order.update({
      where: { id: parsed.data.orderId },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote ?? null,
        trackingNumber: parsed.data.trackingNumber ?? null,
        trackingCarrier: parsed.data.trackingCarrier ?? null,
        inventoryRestoredAt
      }
    });

    if (parsed.data.paymentStatus && order.payment) {
      await tx.payment.update({
        where: { orderId: parsed.data.orderId },
        data: {
          status: parsed.data.paymentStatus,
          confirmedAt:
            parsed.data.paymentStatus === "CONFIRMED" ? new Date() : order.payment.confirmedAt
        }
      });
    }

    if (shouldSendStatusEmail) {
      await enqueueOutboxEvent(tx, outboxEventTypes.orderStatusUpdated, {
        orderId: order.id
      });
    }
  });

  await createAdminAuditLog(
    {
      action: "UPDATE",
      entityType: "ORDER",
      entityId: parsed.data.orderId,
      summary: `Siparis guncellendi: ${order.orderNumber}`,
      metadata: {
        status: parsed.data.status,
        paymentStatus: parsed.data.paymentStatus ?? null,
        trackingNumber: parsed.data.trackingNumber ?? null,
        trackingCarrier: parsed.data.trackingCarrier ?? null
      }
    },
    { adminUserId: admin.id }
  );
  revalidateOrderPaths(parsed.data.orderId);
}

export async function confirmManualPaymentAction(formData: FormData) {
  await assertTrustedMutation("admin:payment-confirm");
  const admin = await requireAdminPermission(adminPermissions.ordersWrite);
  await enforceRateLimit({
    scope: "admin:payment-confirm",
    key: admin.id,
    limit: 25,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla manuel odeme onayi yapildi. Lutfen biraz sonra tekrar deneyin."
  });

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) {
    throw new Error("Siparis bulunamadi");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true }
  });

  if (!order || !order.payment) {
    throw new Error("Odeme kaydi bulunamadi");
  }

  if (order.payment.status === "CONFIRMED") {
    throw new Error("Odeme zaten onayli");
  }

  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    throw new Error("Iptal veya iade edilmis sipariste odeme onaylanamaz");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date()
      }
    });

    const nextStatus = buildOrderStatusAfterManualPaymentConfirmation(order.status as OrderStatus);
    if (nextStatus !== order.status) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus }
      });
    }
  });

  await createAdminAuditLog(
    {
      action: "CONFIRM_PAYMENT",
      entityType: "ORDER",
      entityId: orderId,
      summary: `Manuel odeme onaylandi: ${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber }
    },
    { adminUserId: admin.id }
  );
  revalidateOrderPaths(orderId);
}

export async function updateAdminOrderFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateAdminOrderAction(formData);
    return actionSuccess(undefined, "Siparis guncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Siparis guncellenemedi.");
  }
}

export async function confirmManualPaymentFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await confirmManualPaymentAction(formData);
    return actionSuccess(undefined, "Manuel odeme onaylandi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Manuel odeme onaylanamadi.");
  }
}
