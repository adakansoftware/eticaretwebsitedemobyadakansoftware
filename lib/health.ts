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
    uploadStorageDriver: env.UPLOAD_STORAGE_DRIVER,
    uploadPublicBaseUrl: env.UPLOAD_PUBLIC_BASE_URL,
    uploadS3Endpoint: env.UPLOAD_S3_ENDPOINT,
    uploadS3Region: env.UPLOAD_S3_REGION,
    nodeEnv: process.env.NODE_ENV
  });
}
