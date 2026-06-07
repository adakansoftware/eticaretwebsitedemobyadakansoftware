function normalizeOrigin(origin?: string | null) {
  if (!origin) return null;

  try {
    return new URL(origin).origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeHostOrigin(host?: string | null, protocol?: string | null) {
  if (!host) return null;

  const cleanProtocol = protocol === "http" || protocol === "https" ? protocol : "https";
  return normalizeOrigin(`${cleanProtocol}://${host}`);
}

export function parseTrustedOrigins(value?: string | null) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => normalizeOrigin(item.trim()))
        .filter((item): item is string => Boolean(item))
    )
  );
}

export function buildTrustedOrigins(siteUrl: string, configuredOrigins: string[] = []) {
  return Array.from(
    new Set(
      [normalizeOrigin(siteUrl), ...configuredOrigins]
        .filter((item): item is string => Boolean(item))
    )
  );
}

export function isMutatingMethod(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

export function isTrustedOriginRequest(input: {
  siteUrl: string;
  configuredOrigins?: string[];
  origin?: string | null;
  referer?: string | null;
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}) {
  const trustedOrigins = buildTrustedOrigins(input.siteUrl, input.configuredOrigins ?? []);
  const candidates = [
    normalizeOrigin(input.origin),
    normalizeOrigin(input.referer),
    normalizeHostOrigin(input.forwardedHost ?? input.host, input.forwardedProto ?? "https"),
    normalizeHostOrigin(input.forwardedHost ?? input.host, "http")
  ].filter((item): item is string => Boolean(item));

  return candidates.some((candidate) => trustedOrigins.includes(candidate));
}
