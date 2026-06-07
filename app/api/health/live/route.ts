import { buildJsonApiResponse } from "@/lib/api-response";
import { getRequestId } from "@/lib/request-context";

export async function GET() {
  const requestId = await getRequestId();

  return buildJsonApiResponse(
    {
      ok: true,
      service: "adakan-commerce-core",
      mode: "live",
      timestamp: new Date().toISOString(),
      requestId
    },
    requestId
  );
}
