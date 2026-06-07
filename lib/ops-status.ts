import { OutboxStatus, Role } from "@prisma/client";
import { env } from "@/lib/env";
import { summarizeOpsStatus } from "@/lib/ops-core";
import { prisma } from "@/lib/prisma";

export async function getOpsStatusSummary() {
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
  const outboxBefore = new Date(now.getTime() - env.OUTBOX_STUCK_MINUTES * 60 * 1000);
  const rateLimitWindowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    lowStockProducts,
    stuckOrders,
    staleOutboxEvents,
    deadOutboxEvents,
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
    prisma.outboxEvent.count({
      where: {
        status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        availableAt: { lt: outboxBefore },
        attempts: { lt: env.OUTBOX_MAX_ATTEMPTS }
      }
    }),
    prisma.outboxEvent.count({
      where: {
        status: OutboxStatus.FAILED,
        attempts: { gte: env.OUTBOX_MAX_ATTEMPTS }
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
    staleOutboxEvents,
    deadOutboxEvents,
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
      staleOutboxEvents,
      deadOutboxEvents,
      recentRateLimitBlocks: recentRateLimitBlocks._sum.blockedCount ?? 0,
      expiredPasswordResetTokens,
      staleReplayGuards,
      siteSettingsCount,
      adminUserCount
    },
    thresholds: {
      lowStockAlertThreshold: env.LOW_STOCK_ALERT_THRESHOLD,
      stuckOrderMinutes: env.OPS_STUCK_ORDER_MINUTES,
      outboxStuckMinutes: env.OUTBOX_STUCK_MINUTES,
      outboxMaxAttempts: env.OUTBOX_MAX_ATTEMPTS,
      rateLimitAlertCount: env.OPS_RATE_LIMIT_ALERT_COUNT,
      waitingPaymentTimeoutHours: env.WAITING_PAYMENT_TIMEOUT_HOURS
    }
  };
}
