import "./load-env.mts";
import { OutboxStatus } from "@prisma/client";
import { env } from "../lib/env.ts";
import { prisma } from "../lib/prisma.ts";
import { buildOutboxRecoveryPatch, isRecoverableOutboxEvent } from "../lib/outbox-worker-core.ts";

function readArg(name: string) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

const apply = process.argv.includes("--apply");
const limit = Math.max(1, Number(readArg("limit") ?? "50"));
const idFilter = readArg("id");
const typeFilter = readArg("type");

async function main() {
  const now = new Date();
  const candidates = await prisma.outboxEvent.findMany({
    where: {
      ...(idFilter ? { id: idFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      OR: [
        {
          status: OutboxStatus.FAILED,
          attempts: { gte: env.OUTBOX_MAX_ATTEMPTS }
        },
        {
          status: OutboxStatus.PROCESSING,
          lastAttemptAt: {
            lt: new Date(now.getTime() - env.OUTBOX_STUCK_MINUTES * 60 * 1000)
          }
        }
      ]
    },
    orderBy: [{ updatedAt: "asc" }],
    take: limit
  });

  const recoverable = candidates.filter((event) =>
    isRecoverableOutboxEvent(event, now, env.OUTBOX_STUCK_MINUTES, env.OUTBOX_MAX_ATTEMPTS)
  );

  if (apply) {
    for (const event of recoverable) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: buildOutboxRecoveryPatch(event, now)
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        observedAt: now.toISOString(),
        mode: apply ? "apply" : "dry-run",
        thresholds: {
          outboxStuckMinutes: env.OUTBOX_STUCK_MINUTES,
          outboxMaxAttempts: env.OUTBOX_MAX_ATTEMPTS
        },
        filters: {
          id: idFilter,
          type: typeFilter,
          limit
        },
        candidateCount: recoverable.length,
        candidates: recoverable.map((event) => ({
          id: event.id,
          type: event.type,
          status: event.status,
          attempts: event.attempts,
          availableAt: event.availableAt.toISOString(),
          lastAttemptAt: event.lastAttemptAt?.toISOString() ?? null,
          lastError: event.lastError
        }))
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Outbox requeue failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
