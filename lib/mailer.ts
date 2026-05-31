import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type CommerceEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

function hasMailConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

function getTransporter() {
  if (!hasMailConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildEmailShell({
  title,
  intro,
  content,
  siteName
}: {
  title: string;
  intro: string;
  content: string;
  siteName: string;
}) {
  return `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#b45309;">
          ${escapeHtml(siteName)}
        </p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
          ${escapeHtml(intro)}
        </p>
        ${content}
      </div>
    </div>
  `;
}

export async function sendMail({ to, subject, html, replyTo }: CommerceEmail) {
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`[mail-skipped] to=${to} subject="${subject}" reason=missing-smtp-config`);
    return { skipped: true as const };
  }

  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {})
  });
}
