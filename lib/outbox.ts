import { OutboxStatus, Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { sendAdminNewOrderEmail } from "@/lib/emails/admin-new-order";
import { sendOrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { sendOrderStatusUpdateEmail } from "@/lib/emails/order-status-update";
import { sendPasswordResetEmail } from "@/lib/emails/password-reset";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { buildNextOutboxAvailability } from "@/lib/outbox-core";

type DbClient = Prisma.TransactionClient | typeof prisma;

type PasswordResetEventPayload = {
  userId: string;
  token: string;
};

type OrderEventPayload = {
  orderId: string;
};

export const outboxEventTypes = {
  passwordResetRequested: "PASSWORD_RESET_REQUESTED",
  orderConfirmationRequested: "ORDER_CONFIRMATION_REQUESTED",
  adminNewOrderRequested: "ADMIN_NEW_ORDER_REQUESTED",
  orderStatusUpdated: "ORDER_STATUS_UPDATED"
} as const;

export async function enqueueOutboxEvent(
  db: DbClient,
  type: string,
  payload: Prisma.InputJsonValue
) {
  return db.outboxEvent.create({
    data: {
      type,
      payload
    }
  });
}

async function processPasswordResetRequested(payload: PasswordResetEventPayload) {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true }
  });

  if (!user) {
    return { skipped: true as const, reason: "user_not_found" };
  }

  await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    token: payload.token
  });

  return { skipped: false as const };
}

async function processOrderConfirmationRequested(payload: OrderEventPayload) {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: payload.orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: true
      }
    }),
    getSiteSettings()
  ]);

  if (!order) {
    return { skipped: true as const, reason: "order_not_found" };
  }

  const email = order.user?.email ?? order.guestEmail;
  if (!email) {
    return { skipped: true as const, reason: "recipient_missing" };
  }

  await sendOrderConfirmationEmail({
    email,
    customerName: order.user?.name ?? order.guestName ?? order.shippingFullName,
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal)
    })),
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    shippingTotal: Number(order.shippingTotal),
    grandTotal: Number(order.grandTotal),
    shippingFullName: order.shippingFullName,
    shippingPhone: order.shippingPhone,
    shippingCity: order.shippingCity,
    shippingDistrict: order.shippingDistrict,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    bankAccountInfo: settings?.bankAccountInfo,
    siteName: settings?.siteName ?? "Adakan Commerce"
  });

  return { skipped: false as const };
}

async function processAdminNewOrderRequested(payload: OrderEventPayload) {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: payload.orderId },
      include: {
        user: { select: { name: true, email: true } }
      }
    }),
    getSiteSettings()
  ]);

  if (!order) {
    return { skipped: true as const, reason: "order_not_found" };
  }

  if (!settings?.email) {
    return { skipped: true as const, reason: "admin_email_missing" };
  }

  await sendAdminNewOrderEmail({
    email: settings.email,
    orderNumber: order.orderNumber,
    customerName: order.user?.name ?? order.guestName ?? order.shippingFullName,
    grandTotal: Number(order.grandTotal),
    paymentMethod: order.paymentMethod,
    siteName: settings.siteName,
    adminOrderUrl: `${env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`
  });

  return { skipped: false as const };
}

async function processOrderStatusUpdated(payload: OrderEventPayload) {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: payload.orderId },
      include: {
        user: { select: { name: true, email: true } }
      }
    }),
    getSiteSettings()
  ]);

  if (!order) {
    return { skipped: true as const, reason: "order_not_found" };
  }

  const email = order.user?.email ?? order.guestEmail;
  if (!email) {
    return { skipped: true as const, reason: "recipient_missing" };
  }

  await sendOrderStatusUpdateEmail({
    email,
    customerName: order.user?.name ?? order.guestName ?? order.shippingFullName,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    siteName: settings?.siteName ?? "Adakan Commerce"
  });

  return { skipped: false as const };
}

async function processOutboxEvent(event: {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
}) {
  switch (event.type) {
    case outboxEventTypes.passwordResetRequested:
      return processPasswordResetRequested(event.payload as PasswordResetEventPayload);
    case outboxEventTypes.orderConfirmationRequested:
      return processOrderConfirmationRequested(event.payload as OrderEventPayload);
    case outboxEventTypes.adminNewOrderRequested:
      return processAdminNewOrderRequested(event.payload as OrderEventPayload);
    case outboxEventTypes.orderStatusUpdated:
      return processOrderStatusUpdated(event.payload as OrderEventPayload);
    default:
      return { skipped: true as const, reason: "unknown_event_type" };
  }
}

export async function processPendingOutboxEvents(limit = env.OUTBOX_BATCH_SIZE) {
  const now = new Date();
  const events = await prisma.outboxEvent.findMany({
    where: {
      status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
      availableAt: { lte: now },
      attempts: { lt: env.OUTBOX_MAX_ATTEMPTS }
    },
    orderBy: [{ createdAt: "asc" }],
    take: limit
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const event of events) {
    const claimTime = new Date();
    const claimed = await prisma.outboxEvent.updateMany({
      where: {
        id: event.id,
        status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] }
      },
      data: {
        status: OutboxStatus.PROCESSING,
        attempts: { increment: 1 },
        lastAttemptAt: claimTime,
        lastError: null
      }
    });

    if (claimed.count === 0) {
      continue;
    }

    try {
      const result = await processOutboxEvent(event);

      if (result.skipped) {
        skipped += 1;
      } else {
        sent += 1;
      }

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.SENT,
          processedAt: new Date(),
          lastError: result.skipped ? `skipped:${result.reason}` : null
        }
      });
    } catch (error) {
      failed += 1;
      const attempts = event.attempts + 1;
      const nextAttemptAt = buildNextOutboxAvailability(claimTime, env.OUTBOX_RETRY_MINUTES, attempts);

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.FAILED,
          availableAt: nextAttemptAt,
          lastError: error instanceof Error ? error.message : "Unknown outbox error"
        }
      });

      await logError("outbox.event_failed", error, {
        outboxEventId: event.id,
        type: event.type,
        attempts
      });
    }
  }

  return {
    processed: events.length,
    sent,
    failed,
    skipped
  };
}
