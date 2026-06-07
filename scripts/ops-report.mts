import "./load-env.mts";
import { prisma } from "../lib/prisma.ts";
import { buildOpsStatusSnapshot, buildOrderAnomalySnapshot } from "./ops-shared.mts";

async function main() {
  const [opsStatus, auditSummary, orderAnomalies] = await Promise.all([
    buildOpsStatusSnapshot(),
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
        observedAt: new Date().toISOString(),
        opsStatus,
        orderAnomalies,
        recentAuditEntries: auditSummary
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Ops report failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
