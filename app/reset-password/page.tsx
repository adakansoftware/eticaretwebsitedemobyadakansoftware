import type { Metadata } from "next";
import Link from "next/link";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/lib/actions/auth-actions";

export const metadata: Metadata = {
  title: "Sifremi Yenile"
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token?.trim() ?? "";

  return (
    <AuthShell
      mode="login"
      title="Yeni sifreni belirle"
      description="E-posta ile gelen tek kullanimlik baglanti sayesinde sifreni guvenli bir sekilde yenileyebilirsin."
      highlights={[
        {
          title: "Tek kullanimlik token",
          body: "Ayni baglanti ikinci kez kullanilamaz; sifre yenilenince otomatik kapanir."
        },
        {
          title: "Guclu sifre onerisi",
          body: "En az 8 karakter, harf ve rakam kombinasyonu kullanman daha guvenli olur.",
          tone: "accent"
        }
      ]}
      form={
        token ? (
          <AuthActionForm action={resetPasswordAction} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Sifremi yenile</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Yeni sifreni gir ve hesabina tekrar guvenli sekilde eris.
              </p>
            </div>

            <div className="grid gap-4">
              <Input name="newPassword" type="password" placeholder="Yeni sifre" required />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Yeni sifre tekrar"
                required
              />
              <AuthSubmitButton
                className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800"
                idleLabel="Sifreyi guncelle"
                pendingLabel="Guncelleniyor..."
              />
            </div>

            <p className="text-sm text-slate-600">
              Hesabina donmek icin{" "}
              <Link className="font-bold text-slate-950 hover:text-emerald-700" href="/login">
                giris yap
              </Link>
              .
            </p>
          </AuthActionForm>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Baglanti eksik</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sifre sifirlama tokeni bulunamadi. Yeni bir sifirlama baglantisi istemen gerekiyor.
              </p>
            </div>

            <Link
              href="/forgot-password"
              className="inline-flex h-11 items-center rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Yeni baglanti iste
            </Link>
          </div>
        )
      }
    />
  );
}
