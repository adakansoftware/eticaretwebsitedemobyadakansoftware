import { buildApiHeadersCore } from "@/lib/api-response-core";
import { getHttpErrorStatus } from "@/lib/http-error";
import { buildAdditionalSecurityHeaders } from "@/lib/security-headers";

export function buildApiHeaders(
  requestId: string,
  extraHeaders: Record<string, string> = {}
) {
  return buildApiHeadersCore(
    requestId,
    extraHeaders,
    buildAdditionalSecurityHeaders({
      nodeEnv: process.env.NODE_ENV,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      sentryDsn: process.env.SENTRY_DSN,
      publicSentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      cspReportOnly: process.env.CSP_REPORT_ONLY !== "false",
      cspReportUri: process.env.CSP_REPORT_URI
    })
  );
}

export function buildJsonApiResponse<T>(
  body: T,
  requestId: string,
  init?: { status?: number; headers?: Record<string, string> }
) {
  return Response.json(body, {
    status: init?.status,
    headers: buildApiHeaders(requestId, init?.headers)
  });
}

export function buildErrorApiResponse(
  error: unknown,
  requestId: string,
  fallbackMessage: string,
  fallbackStatus = 400
) {
  return buildJsonApiResponse(
    {
      message: error instanceof Error ? error.message : fallbackMessage,
      requestId
    },
    requestId,
    { status: getHttpErrorStatus(error, fallbackStatus) }
  );
}
