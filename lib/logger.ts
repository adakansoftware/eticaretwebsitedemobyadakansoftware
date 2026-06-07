import { getRequestContext } from "@/lib/request-context";
import { redactLogValue } from "@/lib/log-redaction";

type LogLevel = "info" | "warn" | "error";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

export async function logEvent(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> = {}
) {
  const context = await getRequestContext();
  const redactedPayload = redactLogValue(payload);
  const message = JSON.stringify({
    level,
    event,
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    ip: context.ip,
    userAgent: context.userAgent,
    timestamp: new Date().toISOString(),
    ...(redactedPayload && typeof redactedPayload === "object" ? redactedPayload : {})
  });

  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.info(message);
}

export async function logError(
  event: string,
  error: unknown,
  payload: Record<string, unknown> = {}
) {
  await logEvent("error", event, {
    ...payload,
    error: serializeError(error)
  });
}
