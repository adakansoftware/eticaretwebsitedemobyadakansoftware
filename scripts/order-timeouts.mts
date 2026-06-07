import process from "node:process";
import "./load-env.mts";
import { Prisma } from "@prisma/client";
import { env } from "../lib/env.ts";
import { detectTimedOutWaitingPaymentOrders } from "../lib/order-timeout-core.ts";
import { prisma } from "../lib/prisma.ts";

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function restoreInventoryAndCancelOrder(orderId: string, now: Date) {
  await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true
        }
      });

      if (!order) {
        throw new Error(`Siparis bulunamadi: ${orderId}`);
      }

      if (
        order.status !== "WAITING_PAYMENT" ||
        order.paymentMethod !== "BANK_TRANSFER" ||
        order.inventoryRestoredAt
      ) {
        return;
      }

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
                reason: "ORDER_CANCELLED",
                note: `Odeme timeout ile iptal edildi: ${order.orderNumber}`
              }
            });
            continue;
          }
        }

        const restoredProduct = await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        if (restoredProduct.count === 0) {
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
            reason: "ORDER_CANCELLED",
            note: `Odeme timeout ile iptal edildi: ${order.orderNumber}`
          }
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          inventoryRestoredAt: now,
          adminNote: order.adminNote
            ? `${order.adminNote}\n[system] Havale odeme zaman asimi nedeniyle otomatik iptal edildi.`
            : "[system] Havale odeme zaman asimi nedeniyle otomatik iptal edildi."
        }
      });

      if (order.payment) {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: order.payment.status === "WAITING" ? "REJECTED" : order.payment.status
          }
        });
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

async function main() {
  const apply = hasFlag("--apply");
  const timeoutHours = env.WAITING_PAYMENT_TIMEOUT_HOURS;
  const now = new Date();

  const orders = await prisma.order.findMany({
    where: {
      status: "WAITING_PAYMENT",
      paymentMethod: "BANK_TRANSFER"
    },
    orderBy: { createdAt: "asc" },
    include: {
      payment: {
        select: {
          status: true
        }
      }
    }
  });

  const timedOutOrders = detectTimedOutWaitingPaymentOrders(
    orders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.payment?.status ?? null,
      createdAt: order.createdAt,
      inventoryRestoredAt: order.inventoryRestoredAt
    })),
    timeoutHours,
    now
  );

  const report = {
    mode: apply ? "apply" : "dry-run",
    observedAt: now.toISOString(),
    timeoutHours,
    count: timedOutOrders.length,
    orders: timedOutOrders.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      ageHours: Math.round((now.getTime() - order.createdAt.getTime()) / (60 * 60 * 1000))
    }))
  };

  console.log(JSON.stringify(report, null, 2));

  if (!apply) {
    return;
  }

  for (const order of timedOutOrders) {
    await restoreInventoryAndCancelOrder(order.orderId, now);
  }

  console.log("Timed out waiting-payment orders cancelled.");
}

main()
  .catch((error) => {
    console.error("Order timeout processing failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
