import { Role } from "@prisma/client";
import { env } from "../lib/env.ts";
import { summarizeOpsStatus } from "../lib/ops-core.ts";
import { detectOrderAnomalies } from "../lib/order-anomalies-core.ts";
import { prisma } from "../lib/prisma.ts";

export async function buildOpsStatusSnapshot() {
  const now = new Date();
  const stuckBefore = new Date(now.getTime() - env.OPS_STUCK_ORDER_MINUTES * 60 * 1000);
  const waitingPaymentTimeoutBefore = new Date(
    now.getTime() - env.WAITING_PAYMENT_TIMEOUT_HOURS * 60 * 60 * 1000
  );
  const passwordResetBefore = new Date(
    now.getTime() - env.PASSWORD_RESET_RETENTION_HOURS * 60 * 60 * 1000
  );
  const replayBefore = new Date(
    now.getTime() - env.REPLAY_GUARD_RETENTION_HOURS * 60 * 60 * 1000
  );
  const rateLimitWindowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    lowStockProducts,
    stuckOrders,
    recentRateLimitBlocks,
    expiredPasswordResetTokens,
    staleReplayGuards,
    siteSettingsCount,
    adminUserCount
  ] = await Promise.all([
    prisma.product.count({
      where: {
        isActive: true,
        OR: [
          {
            variants: {
              some: {
                stock: { lte: env.LOW_STOCK_ALERT_THRESHOLD }
              }
            }
          },
          {
            variants: { none: {} },
            stock: { lte: env.LOW_STOCK_ALERT_THRESHOLD }
          }
        ]
      }
    }),
    prisma.order.count({
      where: {
        OR: [
          {
            status: {
              in: ["PENDING", "PAID", "PREPARING"]
            },
            createdAt: {
              lt: stuckBefore
            }
          },
          {
            status: "WAITING_PAYMENT",
            paymentMethod: "BANK_TRANSFER",
            createdAt: {
              lt: waitingPaymentTimeoutBefore
            }
          }
        ]
      }
    }),
    prisma.actionRateLimit.aggregate({
      _sum: {
        blockedCount: true
      },
      where: {
        OR: [
          { lastBlockedAt: { gte: rateLimitWindowStart } },
          { updatedAt: { gte: rateLimitWindowStart } }
        ]
      }
    }),
    prisma.passwordResetToken.count({
      where: {
        OR: [{ expiresAt: { lt: now } }, { createdAt: { lt: passwordResetBefore } }]
      }
    }),
    prisma.operationReplayGuard.count({
      where: {
        OR: [{ expiresAt: { lt: now } }, { updatedAt: { lt: replayBefore } }]
      }
    }),
    prisma.siteSettings.count(),
    prisma.user.count({
      where: { role: Role.ADMIN }
    })
  ]);

  const summary = summarizeOpsStatus({
    lowStockProducts,
    stuckOrders,
    recentRateLimitBlocks: recentRateLimitBlocks._sum.blockedCount ?? 0,
    rateLimitAlertThreshold: env.OPS_RATE_LIMIT_ALERT_COUNT,
    expiredPasswordResetTokens,
    staleReplayGuards,
    missingSiteSettings: siteSettingsCount === 0,
    missingAdminUsers: adminUserCount === 0
  });

  return {
    ...summary,
    observedAt: now.toISOString(),
    metrics: {
      lowStockProducts,
      stuckOrders,
      recentRateLimitBlocks: recentRateLimitBlocks._sum.blockedCount ?? 0,
      expiredPasswordResetTokens,
      staleReplayGuards,
      siteSettingsCount,
      adminUserCount
    },
    thresholds: {
      lowStockAlertThreshold: env.LOW_STOCK_ALERT_THRESHOLD,
      stuckOrderMinutes: env.OPS_STUCK_ORDER_MINUTES,
      rateLimitAlertCount: env.OPS_RATE_LIMIT_ALERT_COUNT,
      waitingPaymentTimeoutHours: env.WAITING_PAYMENT_TIMEOUT_HOURS
    }
  };
}

export async function buildOrderAnomalySnapshot() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      payment: {
        select: {
          status: true
        }
      }
    }
  });

  const anomalies = detectOrderAnomalies(
    orders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      inventoryRestoredAt: order.inventoryRestoredAt
    })),
    {
      stuckOrderMinutes: env.OPS_STUCK_ORDER_MINUTES,
      waitingPaymentTimeoutHours: env.WAITING_PAYMENT_TIMEOUT_HOURS
    }
  ).map((anomaly) => {
    const matchingOrder = orders.find((order) => order.id === anomaly.orderId);
    const ageMinutes = matchingOrder
      ? Math.max(
          0,
          Math.round((Date.now() - matchingOrder.createdAt.getTime()) / (60 * 1000))
        )
      : null;

    return {
      ...anomaly,
      status: matchingOrder?.status ?? null,
      paymentStatus: matchingOrder?.payment?.status ?? null,
      paymentMethod: matchingOrder?.paymentMethod ?? null,
      trackingNumber: matchingOrder?.trackingNumber ?? null,
      trackingCarrier: matchingOrder?.trackingCarrier ?? null,
      ageMinutes
    };
  });

  const reasons = Object.entries(
    anomalies.reduce<Record<string, number>>((acc, anomaly) => {
      for (const reason of anomaly.reasons) {
        acc[reason] = (acc[reason] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({ reason, count }));

  return {
    observedAt: new Date().toISOString(),
    thresholds: {
      stuckOrderMinutes: env.OPS_STUCK_ORDER_MINUTES,
      waitingPaymentTimeoutHours: env.WAITING_PAYMENT_TIMEOUT_HOURS
    },
    totalOrdersScanned: orders.length,
    anomalyCount: anomalies.length,
    reasons,
    latestAnomalies: anomalies.slice(0, 25)
  };
}
