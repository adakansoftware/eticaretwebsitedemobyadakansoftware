import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { getRequestId } from "@/lib/request-context";

export async function POST() {
  const requestId = await getRequestId();

  try {
    await clearSession();
    return NextResponse.json(
      { ok: true, requestId },
      { headers: { "x-request-id": requestId } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Cikis yapilamadi",
        requestId
      },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }
}
