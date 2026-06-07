import assert from "node:assert/strict";
import { processOutboxBatch } from "../lib/outbox-worker-core.ts";

type FakeEvent = {
  id: string;
  type: string;
  payload: unknown;
  status: "PENDING" | "FAILED" | "PROCESSING" | "SENT";
  attempts: number;
  availableAt: Date;
  lastAttemptAt?: Date | null;
  lastError?: string | null;
  processedAt?: Date | null;
};

async function main() {
  const sharedNow = new Date("2026-06-07T18:30:00.000Z");
  const events: FakeEvent[] = [
    {
      id: "evt-1",
      type: "PASSWORD_RESET_REQUESTED",
      payload: { userId: "u1" },
      status: "PENDING",
      attempts: 0,
      availableAt: new Date("2026-06-07T18:00:00.000Z")
    },
    {
      id: "evt-2",
      type: "ORDER_CONFIRMATION_REQUESTED",
      payload: { orderId: "o1" },
      status: "FAILED",
      attempts: 1,
      availableAt: new Date("2026-06-07T18:10:00.000Z")
    },
    {
      id: "evt-3",
      type: "ADMIN_NEW_ORDER_REQUESTED",
      payload: { orderId: "o2" },
      status: "PENDING",
      attempts: 0,
      availableAt: new Date("2026-06-07T18:15:00.000Z")
    }
  ];

  const processedIds: string[] = [];
  const store = {
    async listProcessableEvents(now: Date, limit: number) {
      return events
        .filter((event) => event.availableAt <= now && event.attempts < 5 && ["PENDING", "FAILED"].includes(event.status))
        .slice(0, limit);
    },
    async claimEvent(eventId: string, claimTime: Date) {
      const event = events.find((item) => item.id === eventId);
      if (!event || !["PENDING", "FAILED"].includes(event.status)) {
        return false;
      }

      event.status = "PROCESSING";
      event.attempts += 1;
      event.lastAttemptAt = claimTime;
      event.lastError = null;
      return true;
    },
    async markSent(eventId: string, processedAt: Date, options?: { skippedReason?: string | null }) {
      const event = events.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("event not found");
      }

      event.status = "SENT";
      event.processedAt = processedAt;
      event.lastError = options?.skippedReason ? `skipped:${options.skippedReason}` : null;
    },
    async markFailed(eventId: string, options: { availableAt: Date; lastError: string }) {
      const event = events.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("event not found");
      }

      event.status = "FAILED";
      event.availableAt = options.availableAt;
      event.lastError = options.lastError;
    }
  };

  const result = await processOutboxBatch(
    store,
    async (event) => {
      processedIds.push(event.id);

      if (event.id === "evt-2") {
        throw new Error("smtp unavailable");
      }

      if (event.id === "evt-3") {
        return { skipped: true, reason: "recipient_missing" };
      }

      return { skipped: false };
    },
    {
      now: sharedNow,
      limit: 10,
      maxAttempts: 5,
      retryMinutes: 10
    }
  );

  assert.deepEqual(processedIds, ["evt-1", "evt-2", "evt-3"]);
  assert.deepEqual(result, {
    processed: 3,
    sent: 1,
    failed: 1,
    skipped: 1
  });

  const successful = events.find((event) => event.id === "evt-1");
  const failed = events.find((event) => event.id === "evt-2");
  const skipped = events.find((event) => event.id === "evt-3");

  assert.equal(successful?.status, "SENT");
  assert.equal(successful?.lastError, null);

  assert.equal(failed?.status, "FAILED");
  assert.equal(failed?.lastError, "smtp unavailable");
  assert.equal(Boolean(failed?.lastAttemptAt), true);
  assert.equal(
    failed && failed.lastAttemptAt
      ? failed.availableAt.getTime() > failed.lastAttemptAt.getTime()
      : false,
    true
  );

  assert.equal(skipped?.status, "SENT");
  assert.equal(skipped?.lastError, "skipped:recipient_missing");

  console.log("PASS integration outbox batch processes success, failure, and skip paths");
  console.log("All 1 integration check passed.");
}

main().catch((error) => {
  console.error("Integration test run failed.");
  console.error(error);
  process.exit(1);
});
