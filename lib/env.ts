import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  TRUSTED_ORIGINS: z.string().optional(),
  ORDER_REPLAY_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(180),
  RATE_LIMIT_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
  PASSWORD_RESET_RETENTION_HOURS: z.coerce.number().int().positive().default(24),
  REPLAY_GUARD_RETENTION_HOURS: z.coerce.number().int().positive().default(24),
  OUTBOX_RETENTION_DAYS: z.coerce.number().int().positive().default(14),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OUTBOX_RETRY_MINUTES: z.coerce.number().int().positive().default(10),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  OUTBOX_STUCK_MINUTES: z.coerce.number().int().positive().default(30),
  LOW_STOCK_ALERT_THRESHOLD: z.coerce.number().int().nonnegative().default(5),
  OPS_STUCK_ORDER_MINUTES: z.coerce.number().int().positive().default(120),
  OPS_RATE_LIMIT_ALERT_COUNT: z.coerce.number().int().positive().default(10),
  WAITING_PAYMENT_TIMEOUT_HOURS: z.coerce.number().int().positive().default(24),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  CSP_REPORT_ONLY: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value !== false && value !== "false"),
  CSP_REPORT_URI: z.string().optional(),
  BACKUP_DRILL_DATABASE_URL: z.string().url().optional().or(z.literal("")),
  BACKUP_DRILL_RESTORE_DATABASE_URL: z.string().url().optional().or(z.literal("")),
  BACKUP_PGDUMP_PATH: z.string().optional(),
  BACKUP_PSQL_PATH: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional()
}).superRefine((value, ctx) => {
  const smtpValues = [value.SMTP_HOST, value.SMTP_USER, value.SMTP_PASS, value.SMTP_FROM];
  const configuredSmtpFields = smtpValues.filter(Boolean).length;

  if (configuredSmtpFields > 0 && configuredSmtpFields < smtpValues.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SMTP_HOST"],
      message: "SMTP ayarlari kismi degil, tam olarak birlikte tanimlanmali"
    });
  }

  const sentryValues = [value.SENTRY_AUTH_TOKEN, value.SENTRY_ORG, value.SENTRY_PROJECT];
  const configuredSentryReleaseFields = sentryValues.filter(Boolean).length;
  if (
    configuredSentryReleaseFields > 0 &&
    configuredSentryReleaseFields < sentryValues.length
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SENTRY_AUTH_TOKEN"],
      message: "Sentry release ayarlari kismi degil, birlikte tanimlanmali"
    });
  }

  if (value.BACKUP_DRILL_RESTORE_DATABASE_URL && !value.BACKUP_DRILL_DATABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["BACKUP_DRILL_DATABASE_URL"],
      message: "Restore tatbikati icin kaynak backup veritabani da tanimlanmali"
    });
  }
});

export const env = envSchema.parse(process.env);
