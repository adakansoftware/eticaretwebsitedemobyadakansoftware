import { env } from "@/lib/env";

export const sessionCookieName = "adakan_session";
export const sessionIssuer = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
export const sessionAudience = "adakan-commerce-core";
export const sessionSecret = new TextEncoder().encode(env.AUTH_SECRET);

export function isSecureCookieEnvironment(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "production";
}
