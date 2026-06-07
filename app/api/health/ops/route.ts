import { buildJsonApiResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { getOpsStatusSummary } from "@/lib/ops-status";
import { getRequestId } from "@/lib/request-context";

export async function GET() {
  const requestId = await getRequestId();

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return buildJsonApiResponse(
        {
          ok: false,
          mode: "ops",
          requestId,
          error: "Yetkisiz"
        },
        requestId,
        { status: 401 }
      );
    }

    const summary = await getOpsStatusSummary();

    return buildJsonApiResponse(
      {
        ...summary,
        mode: "ops",
        requestId
      },
      requestId,
      { status: 200 }
    );
  } catch (error) {
    await logError("health.ops.failed", error);
    return buildJsonApiResponse(
      {
        ok: false,
        mode: "ops",
        requestId,
        error: "Ops status alinamadi"
      },
      requestId,
      { status: 500 }
    );
  }
}
