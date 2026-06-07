import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { getOpsStatusSummary } from "@/lib/ops-status";
import { getRequestId } from "@/lib/request-context";

export async function GET() {
  const requestId = await getRequestId();

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          mode: "ops",
          requestId,
          error: "Yetkisiz"
        },
        {
          status: 401,
          headers: {
            "x-request-id": requestId,
            "cache-control": "no-store"
          }
        }
      );
    }

    const summary = await getOpsStatusSummary();

    return NextResponse.json(
      {
        ...summary,
        mode: "ops",
        requestId
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    await logError("health.ops.failed", error);
    return NextResponse.json(
      {
        ok: false,
        mode: "ops",
        requestId,
        error: "Ops status alinamadi"
      },
      {
        status: 500,
        headers: {
          "x-request-id": requestId,
          "cache-control": "no-store"
        }
      }
    );
  }
}
