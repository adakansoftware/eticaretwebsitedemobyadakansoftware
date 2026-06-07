import { NextResponse } from "next/server";
import { getRequestId } from "@/lib/request-context";

export async function GET() {
  const requestId = await getRequestId();

  return NextResponse.json(
    {
      ok: true,
      service: "adakan-commerce-core",
      mode: "live",
      timestamp: new Date().toISOString(),
      requestId
    },
    {
      headers: {
        "x-request-id": requestId,
        "cache-control": "no-store"
      }
    }
  );
}
