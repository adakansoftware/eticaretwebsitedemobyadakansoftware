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

  // SMTP altyapisi bir sonraki gorevde baglanacak. Simdilik akis kirilmasin diye logluyoruz.
  console.info(`[password-reset-email] to=${email} name=${name} url=${resetUrl}`);

  return {
    subject: "Sifre sifirlama baglantisi",
    resetUrl
  };
}
