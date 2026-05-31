import { buildEmailShell, escapeHtml, sendMail } from "@/lib/mailer";
import { env } from "@/lib/env";

type SendPasswordResetEmailParams = {
  email: string;
  name: string;
  token: string;
};

export async function sendPasswordResetEmail({
  email,
  name,
  token
}: SendPasswordResetEmailParams) {
  const resetUrl = `${env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: "Sifre sifirlama baglantisi",
    html: buildEmailShell({
      title: "Sifreni yenile",
      intro: "Sifre sifirlama talebi alindi. Asagidaki baglanti 1 saat boyunca gecerli olacak.",
      content: `
        <p style="margin:0 0 24px;color:#475569;">Merhaba <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 24px;color:#475569;">
          Yeni sifre belirlemek icin asagidaki butonu kullanabilirsin.
        </p>
        <p style="margin:0 0 20px;">
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;">
            Sifremi yenile
          </a>
        </p>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
          Buton calismazsa bu baglantiyi tarayicina yapistir:<br />
          <span>${escapeHtml(resetUrl)}</span>
        </p>
      `,
      siteName: "Adakan Commerce"
    })
  });
}
