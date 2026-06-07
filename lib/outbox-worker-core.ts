export const outboxPendingStatuses = ["PENDING", "FAILED"] as const;

export type OutboxWorkerStatus = "PENDING" | "FAILED" | "PROCESSING" | "SENT";

export type OutboxWorkerEvent = {
  id: string;
  type: string;
  payload: unknown;
  status: OutboxWorkerStatus;
  attempts: number;
  availableAt: Date;
  lastAttemptAt?: Date | null;
  lastError?: string | null;
};

export type OutboxWorkerStore = {
  listProcessableEvents: (now: Date, limit: number) => Promise<OutboxWorkerEvent[]>;
  claimEvent: (eventId: string, claimTime: Date) => Promise<boolean>;
  markSent: (
    eventId: string,
    processedAt: Date,
    options?: { skippedReason?: string | null }
  ) => Promise<void>;
  markFailed: (
    eventId: string,
    options: { availableAt: Date; lastError: string }
  ) => Promise<void>;
};

export type OutboxProcessorResult = {
  skipped: boolean;
  reason?: string;
};

export type OutboxBatchResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
};

function buildNextOutboxAvailability(lastAttemptAt: Date, retryMinutes: number, attempts: number) {
  const multiplier = Math.max(1, attempts);
  return new Date(lastAttemptAt.getTime() + retryMinutes * multiplier * 60 * 1000);
}

export function isProcessableOutboxEvent(
  event: Pick<OutboxWorkerEvent, "status" | "availableAt" | "attempts">,
  now: Date,
  maxAttempts: number
) {
  return (
    outboxPendingStatuses.includes(event.status as (typeof outboxPendingStatuses)[number]) &&
    event.availableAt <= now &&
    event.attempts < maxAttempts
  );
}

export function isRecoverableOutboxEvent(
  event: Pick<OutboxWorkerEvent, "status" | "attempts" | "lastAttemptAt">,
  now: Date,
  stuckMinutes: number,
  maxAttempts: number
) {
  const processingDeadline = new Date(now.getTime() - stuckMinutes * 60 * 1000);

  return (
    (event.status === "FAILED" && event.attempts >= maxAttempts) ||
    (event.status === "PROCESSING" &&
      Boolean(event.lastAttemptAt && event.lastAttemptAt < processingDeadline))
  );
}

export function buildOutboxRecoveryPatch(event: Pick<OutboxWorkerEvent, "status" | "attempts">, now: Date) {
  return {
    status: "PENDING" as const,
    attempts: 0,
    availableAt: now,
    lastAttemptAt: null,
    processedAt: null,
    lastError: `manual_requeue_from:${event.status}:${event.attempts}:${now.toISOString()}`
  };
}

export async function processOutboxBatch(
  store: OutboxWorkerStore,
  processor: (event: OutboxWorkerEvent) => Promise<OutboxProcessorResult>,
  options: { now?: Date; limit: number; maxAttempts: number; retryMinutes: number }
) {
  const now = options.now ?? new Date();
  const events = await store.listProcessableEvents(now, options.limit);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const event of events) {
    const claimTime = new Date();
    const claimed = await store.claimEvent(event.id, claimTime);

    if (!claimed) {
      continue;
    }

    try {
      const result = await processor(event);

      if (result.skipped) {
        skipped += 1;
      } else {
        sent += 1;
      }

      await store.markSent(event.id, new Date(), {
        skippedReason: result.skipped ? result.reason ?? "unspecified" : null
      });
    } catch (error) {
      failed += 1;
      const attempts = event.attempts + 1;

      await store.markFailed(event.id, {
        availableAt: buildNextOutboxAvailability(claimTime, options.retryMinutes, attempts),
        lastError: error instanceof Error ? error.message : "Unknown outbox error"
      });
    }
  }

  return {
    processed: events.length,
    sent,
    failed,
    skipped
  } satisfies OutboxBatchResult;
}
