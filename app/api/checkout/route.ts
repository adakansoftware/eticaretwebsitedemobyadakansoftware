import { buildApiHeaders } from "@/lib/api-response";
import { NextResponse } from "next/server";
import { processCheckout } from "@/lib/actions/checkout-actions";
import { env } from "@/lib/env";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

export async function POST(request: Request) {
  const requestId = await getRequestId();

  try {
    const formData = await request.formData();
    const targetPath = await processCheckout(formData);

    return NextResponse.redirect(new URL(targetPath, env.NEXT_PUBLIC_SITE_URL), {
      status: 303,
      headers: buildApiHeaders(requestId)
    });
  } catch (error) {
    await logError("checkout.route_failed", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Checkout tamamlanamadi",
        requestId
      },
      { status: 400, headers: buildApiHeaders(requestId) }
    );
  }
}
