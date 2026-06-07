import { NextResponse } from "next/server";
import { getEnvHealthIndicators, summarizeHealth } from "@/lib/health";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getRequestId } from "@/lib/request-context";

export async function GET() {
  const requestId = await getRequestId();
  const indicators = [...getEnvHealthIndicators()];

  try {
    await prisma.$queryRaw`SELECT 1`;
    indicators.push({ name: "database", ok: true });
  } catch (error) {
    indicators.push({
      name: "database",
      ok: false,
      detail: error instanceof Error ? error.message : "Database check failed"
    });
    await logError("health.ready.database_failed", error);
  }

  try {
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.siteSettings.count()
    ]);
    indicators.push({ name: "critical_tables", ok: true });
  } catch (error) {
    indicators.push({
      name: "critical_tables",
      ok: false,
      detail: error instanceof Error ? error.message : "Critical table check failed"
    });
    await logError("health.ready.critical_tables_failed", error);
  }

  const summary = summarizeHealth(indicators);

  return NextResponse.json(
    {
      ...summary,
      mode: "ready",
      timestamp: new Date().toISOString(),
      requestId
    },
    {
      status: summary.ok ? 200 : 503,
      headers: {
        "x-request-id": requestId,
        "cache-control": "no-store"
      }
    }
  );
}
