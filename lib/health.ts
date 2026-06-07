import { env } from "@/lib/env";
import { getEnvHealthIndicatorsFromConfig, summarizeHealth } from "@/lib/health-core";

export { summarizeHealth };

export function getEnvHealthIndicators() {
  return getEnvHealthIndicatorsFromConfig({
    authSecret: env.AUTH_SECRET,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    smtpHost: env.SMTP_HOST,
    smtpUser: env.SMTP_USER,
    smtpPass: env.SMTP_PASS,
    smtpFrom: env.SMTP_FROM,
    nodeEnv: process.env.NODE_ENV
  });
}
