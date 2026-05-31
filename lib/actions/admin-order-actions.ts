"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/emails/order-status-update";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/site-settings";
import { orderAdminSchema } from "@/lib/validators";

const blockedRollbackStatuses = new Set(["CANCELLED", "REFUNDED"]);
const rollbackStatuses = new Set(["CANCELLED", "REFUNDED"]);

function ensureStatusTransition(currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus) return;
  if (blockedRollbackStatuses.has(currentStatus)) {
    throw new Error("Iptal veya iade edilmis siparis farkli bir duruma geri alinamaz");
  }
  if (currentStatus === "DELIVERED" && nextStatus !== "REFUNDED") {
    throw new Error("Teslim edilen siparis yalnizca iade akisina alinabilir");
  }
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateAdminOrderAction(formData: FormData) {
  const admin = await requireAdmin();
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

  if (!order) throw new Error("Siparis bulunamadi");

  ensureStatusTransition(order.status, parsed.data.status);

  await prisma.$transaction(async (tx) => {
    let inventoryRestoredAt = order.inventoryRestoredAt;

    if (
      order.status !== parsed.data.status &&
      rollbackStatuses.has(parsed.data.status) &&
      !order.inventoryRestoredAt
    ) {
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) continue;

        const nextStock = product.stock + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: nextStock }
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            change: item.quantity,
            stockAfter: nextStock,
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
  });

  await createAdminAuditLog({
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
  });
  revalidateOrderPaths(parsed.data.orderId);

  const shouldSendStatusEmail =
    order.status !== parsed.data.status ||
    (parsed.data.trackingNumber ?? null) !== (order.trackingNumber ?? null) ||
    (parsed.data.trackingCarrier ?? null) !== (order.trackingCarrier ?? null);

  const recipientEmail = order.user?.email ?? order.guestEmail;
  const recipientName = order.user?.name ?? order.guestName ?? order.shippingFullName;
  if (shouldSendStatusEmail && recipientEmail) {
    try {
      const settings = await getSiteSettings();
      await sendOrderStatusUpdateEmail({
        email: recipientEmail,
        customerName: recipientName,
        orderNumber: order.orderNumber,
        status: parsed.data.status,
        trackingNumber: parsed.data.trackingNumber ?? null,
        trackingCarrier: parsed.data.trackingCarrier ?? null,
        siteName: settings?.siteName ?? "Adakan Commerce"
      });
    } catch (error) {
      console.error("Siparis durum e-postasi gonderilemedi", {
        orderId: order.id,
        error
      });
    }
  }
}

export async function confirmManualPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:payment-confirm",
    key: admin.id,
    limit: 25,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla manuel odeme onayi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) throw new Error("Siparis bulunamadi");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true }
  });

  if (!order || !order.payment) throw new Error("Odeme kaydi bulunamadi");
  if (order.payment.status === "CONFIRMED") throw new Error("Odeme zaten onayli");
  if (blockedRollbackStatuses.has(order.status)) {
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

    if (order.status === "WAITING_PAYMENT" || order.status === "PENDING") {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });
    }
  });

  await createAdminAuditLog({
    action: "CONFIRM_PAYMENT",
    entityType: "ORDER",
    entityId: orderId,
    summary: `Manuel odeme onaylandi: ${order.orderNumber}`,
    metadata: { orderNumber: order.orderNumber }
  });
  revalidateOrderPaths(orderId);
}

export async function updateAdminOrderFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateAdminOrderAction(formData);
    return actionSuccess(undefined, "Sipariş güncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Sipariş güncellenemedi.");
  }
}

export async function confirmManualPaymentFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await confirmManualPaymentAction(formData);
    return actionSuccess(undefined, "Manuel ödeme onaylandı.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Manuel ödeme onaylanamadı.");
  }
}
