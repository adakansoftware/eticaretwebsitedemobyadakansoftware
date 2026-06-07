import { headers } from "next/headers";
import { env } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { buildTrustedOrigins, isTrustedOriginRequest, parseTrustedOrigins } from "@/lib/origin";

export async function assertTrustedMutation(scope: string) {
  const headerStore = await headers();
  const configuredOrigins = parseTrustedOrigins(env.TRUSTED_ORIGINS);

  const trusted = isTrustedOriginRequest({
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    configuredOrigins: buildTrustedOrigins(env.NEXT_PUBLIC_SITE_URL, configuredOrigins),
    origin: headerStore.get("origin"),
    referer: headerStore.get("referer"),
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    forwardedProto: headerStore.get("x-forwarded-proto")
  });

  if (trusted) {
    return;
  }

  await logEvent("warn", "security.trusted_origin_rejected", {
    scope,
    origin: headerStore.get("origin"),
    referer: headerStore.get("referer"),
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host")
  });

  throw new Error("Istek guvenlik dogrulamasini gecemedi");
}
