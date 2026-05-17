"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  await requireAdmin();

  const parsed = orderAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Siparis verisi gecersiz");
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payment: true, items: true }
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

  revalidateOrderPaths(parsed.data.orderId);
}

export async function confirmManualPaymentAction(formData: FormData) {
  await requireAdmin();
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

  revalidateOrderPaths(orderId);
}
