import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

export const requestIdHeaderName = "x-request-id";

export function createRequestId() {
  return randomUUID();
}

export async function getRequestId() {
  const headerStore = await headers();
  return headerStore.get(requestIdHeaderName) ?? createRequestId();
}

export async function getRequestContext() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const realIp = headerStore.get("x-real-ip")?.trim() ?? null;

  return {
    requestId: headerStore.get(requestIdHeaderName) ?? createRequestId(),
    method: headerStore.get("x-forwarded-method") ?? null,
    path: headerStore.get("x-forwarded-path") ?? null,
    ip: forwardedFor ?? realIp,
    userAgent: headerStore.get("user-agent") ?? null
  };
}
