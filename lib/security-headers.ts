type SecurityHeaderInput = {
  nodeEnv?: string;
  siteUrl: string;
  sentryDsn?: string;
  publicSentryDsn?: string;
  cspReportOnly?: boolean;
  cspReportUri?: string;
};

function extractOrigin(value?: string) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(input: SecurityHeaderInput) {
  const siteOrigin = extractOrigin(input.siteUrl);
  const sentryOrigins = Array.from(
    new Set(
      [extractOrigin(input.sentryDsn), extractOrigin(input.publicSentryDsn)].filter(
        (value): value is string => Boolean(value)
      )
    )
  );

  const connectSources = new Set(["'self'"]);
  if (siteOrigin) {
    connectSources.add(siteOrigin);
    if (siteOrigin.startsWith("https://")) {
      connectSources.add(siteOrigin.replace("https://", "wss://"));
    }
    if (siteOrigin.startsWith("http://")) {
      connectSources.add(siteOrigin.replace("http://", "ws://"));
    }
  }

  for (const origin of sentryOrigins) {
    connectSources.add(origin);
  }

  if (input.nodeEnv !== "production") {
    connectSources.add("http://localhost:3000");
    connectSources.add("ws://localhost:3000");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://images.unsplash.com http://localhost:3000",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${Array.from(connectSources).join(" ")}`,
    "font-src 'self' data:",
    `script-src 'self'${input.nodeEnv !== "production" ? " 'unsafe-eval'" : ""}`,
    "worker-src 'self' blob:"
  ];

  if (input.cspReportUri) {
    directives.push(`report-uri ${input.cspReportUri}`);
  }

  return directives.join("; ");
}

export function buildAdditionalSecurityHeaders(input: SecurityHeaderInput) {
  const headers: Record<string, string> = {};
  headers[input.cspReportOnly === false ? "content-security-policy" : "content-security-policy-report-only"] =
    buildContentSecurityPolicy(input);

  if (input.nodeEnv === "production") {
    headers["strict-transport-security"] = "max-age=31536000; includeSubDomains; preload";
  }

  return headers;
}
