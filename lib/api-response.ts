export function buildApiHeaders(
  requestId: string,
  extraHeaders: Record<string, string> = {}
) {
  const headers = new Headers(extraHeaders);
  headers.set("x-request-id", requestId);
  headers.set("cache-control", "no-store");
  return headers;
}
