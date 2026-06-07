export function buildApiHeadersCore(
  requestId: string,
  extraHeaders: Record<string, string> = {},
  securityHeaders: Record<string, string> = {}
) {
  const headers = new Headers(securityHeaders);
  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }
  headers.set("x-request-id", requestId);
  headers.set("cache-control", "no-store");
  return headers;
}
