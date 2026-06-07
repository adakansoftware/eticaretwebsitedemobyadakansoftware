import { buildApiHeaders } from "@/lib/api-response";
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

export async function POST() {
  const requestId = await getRequestId();

  try {
    await clearSession();
    return NextResponse.json({ ok: true, requestId }, { headers: buildApiHeaders(requestId) });
  } catch (error) {
    await logError("auth.logout_failed", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Cikis yapilamadi",
        requestId
      },
      { status: 400, headers: buildApiHeaders(requestId) }
    );
  }
}
