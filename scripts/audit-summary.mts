import "./load-env.mts";
import { prisma } from "../lib/prisma.ts";

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentByAction, recentByEntity, latestEntries] = await Promise.all([
    prisma.adminAuditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { action: "desc" } }
    }),
    prisma.adminAuditLog.groupBy({
      by: ["entityType"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { entityType: "desc" } }
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        createdAt: true,
        action: true,
        entityType: true,
        entityId: true,
        summary: true,
        requestId: true
      }
    })
  ]);

  console.log(
    JSON.stringify(
      {
        since: since.toISOString(),
        recentByAction,
        recentByEntity,
        latestEntries
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Audit summary failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
