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
  LOW_STOCK_ALERT_THRESHOLD: z.coerce.number().int().nonnegative().default(5),
  OPS_STUCK_ORDER_MINUTES: z.coerce.number().int().positive().default(120),
  OPS_RATE_LIMIT_ALERT_COUNT: z.coerce.number().int().positive().default(10),
  WAITING_PAYMENT_TIMEOUT_HOURS: z.coerce.number().int().positive().default(24),
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

});

export const env = envSchema.parse(process.env);
