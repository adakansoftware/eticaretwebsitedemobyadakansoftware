import process from "node:process";
import "./load-env.mts";
import { env } from "../lib/env.ts";
import { prisma } from "../lib/prisma.ts";

type CleanupPlan = {
  auditLogs: number;
  rateLimits: number;
  replayGuards: number;
  passwordResetTokens: number;
};

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function buildPlan(now: Date): Promise<CleanupPlan> {
  const auditBefore = new Date(now.getTime() - env.AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const rateLimitBefore = new Date(
    now.getTime() - env.RATE_LIMIT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  const replayBefore = new Date(
    now.getTime() - env.REPLAY_GUARD_RETENTION_HOURS * 60 * 60 * 1000
  );
  const passwordResetBefore = new Date(
    now.getTime() - env.PASSWORD_RESET_RETENTION_HOURS * 60 * 60 * 1000
  );

  const [auditLogs, rateLimits, replayGuards, passwordResetTokens] = await Promise.all([
    prisma.adminAuditLog.count({ where: { createdAt: { lt: auditBefore } } }),
    prisma.actionRateLimit.count({
      where: {
        OR: [{ expiresAt: { lt: now } }, { updatedAt: { lt: rateLimitBefore } }]
      }
    }),
    prisma.operationReplayGuard.count({
      where: {
        OR: [{ expiresAt: { lt: now } }, { updatedAt: { lt: replayBefore } }]
      }
    }),
    prisma.passwordResetToken.count({
      where: {
        OR: [{ expiresAt: { lt: now } }, { createdAt: { lt: passwordResetBefore } }]
      }
    })
  ]);

  return { auditLogs, rateLimits, replayGuards, passwordResetTokens };
}

async function applyPlan(now: Date) {
  const auditBefore = new Date(now.getTime() - env.AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const rateLimitBefore = new Date(
    now.getTime() - env.RATE_LIMIT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  const replayBefore = new Date(
    now.getTime() - env.REPLAY_GUARD_RETENTION_HOURS * 60 * 60 * 1000
  );
  const passwordResetBefore = new Date(
    now.getTime() - env.PASSWORD_RESET_RETENTION_HOURS * 60 * 60 * 1000
  );

  await prisma.$transaction([
    prisma.adminAuditLog.deleteMany({ where: { createdAt: { lt: auditBefore } } }),
    prisma.actionRateLimit.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { updatedAt: { lt: rateLimitBefore } }]
      }
    }),
    prisma.operationReplayGuard.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { updatedAt: { lt: replayBefore } }]
      }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { createdAt: { lt: passwordResetBefore } }]
      }
    })
  ]);
}

async function main() {
  const dryRun = hasFlag("--dry-run") || !hasFlag("--apply");
  const now = new Date();
  const plan = await buildPlan(now);

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "apply",
        at: now.toISOString(),
        plan
      },
      null,
      2
    )
  );

  if (dryRun) {
    return;
  }

  await applyPlan(now);
  console.log("Cleanup applied.");
}

main()
  .catch((error) => {
    console.error("Ops cleanup failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
