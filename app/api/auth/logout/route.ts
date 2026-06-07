import { buildErrorApiResponse, buildJsonApiResponse } from "@/lib/api-response";
import { clearSession } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-context";
import { assertTrustedMutation } from "@/lib/security";

export async function POST() {
  const requestId = await getRequestId();

  try {
    await assertTrustedMutation("auth:logout-route");
    const fingerprint = await getRequestFingerprint();
    await enforceRateLimit({
      scope: "auth:logout-route",
      key: fingerprint,
      limit: 20,
      windowMs: 60 * 1000,
      message: "Cok fazla cikis istegi gonderildi. Lutfen biraz sonra tekrar deneyin."
    });
    await clearSession();
    return buildJsonApiResponse({ ok: true, requestId }, requestId);
  } catch (error) {
    await logError("auth.logout_failed", error);
    return buildErrorApiResponse(error, requestId, "Cikis yapilamadi");
  }
}
