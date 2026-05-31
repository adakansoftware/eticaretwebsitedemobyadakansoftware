import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Input } from "@/components/ui/input";
import { customerLoginFormAction } from "@/lib/actions/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <AuthShell
      mode="login"
      title="Hesabina giris yap"
      description="Bu ekran sadece musteri hesaplari icin. Siparislerini, adreslerini ve favorilerini yonetmek icin buradan oturum ac."
      form={
        <AuthActionForm action={customerLoginFormAction} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Giris yap</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Musteri hesabinla devam et.</p>
          </div>

          <div className="grid gap-4">
            <Input name="email" type="email" placeholder="E-posta" required />
            <Input name="password" type="password" placeholder="Sifre" required />
            <AuthSubmitButton
              className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800"
              idleLabel="Giris yap"
              pendingLabel="Giris yapiliyor..."
            />
          </div>

          <Link
            href="/forgot-password"
            className="inline-flex text-sm font-bold text-slate-700 transition hover:text-emerald-700"
          >
            Sifremi unuttum
          </Link>

          <p className="text-sm text-slate-600">
            Hesabin yok mu?{" "}
            <Link className="font-bold text-slate-950 hover:text-emerald-700" href="/register">
              Musteri hesabi olustur
            </Link>
          </p>
        </AuthActionForm>
      }
    />
  );
}
