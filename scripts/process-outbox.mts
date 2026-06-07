import "./load-env.mts";
import { processPendingOutboxEvents } from "../lib/outbox.ts";
import { prisma } from "../lib/prisma.ts";

try {
  const result = await processPendingOutboxEvents();
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
