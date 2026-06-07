export function buildApiHeaders(
  requestId: string,
  extraHeaders: Record<string, string> = {}
) {
  const headers = new Headers(extraHeaders);
  headers.set("x-request-id", requestId);
  headers.set("cache-control", "no-store");
  return headers;
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
