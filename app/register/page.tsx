import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Input } from "@/components/ui/input";
import { registerFormAction } from "@/lib/actions/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <AuthShell
      mode="register"
      title="Yeni musteri hesabi olustur"
      description="Bu ekran sadece musteri hesabi acmak icin kullanilir. Siparis ve adres yonetimi icin burada kayit ol."
      form={
        <AuthActionForm action={registerFormAction} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Uye ol</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Siparis, adres ve favori yonetimi icin musteri hesabini burada olusturabilirsin.
            </p>
          </div>

          <div className="grid gap-4">
            <Input name="name" placeholder="Ad soyad" required />
            <Input name="email" type="email" placeholder="E-posta" required />
            <Input name="password" type="password" placeholder="Sifre" required />
            <AuthSubmitButton
              className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800"
              idleLabel="Musteri hesabi olustur"
              pendingLabel="Hesap olusturuluyor..."
            />
          </div>

          <p className="text-sm text-slate-600">
            Zaten hesabin var mi?{" "}
            <Link className="font-bold text-slate-950 hover:text-emerald-700" href="/login">
              Giris yap
            </Link>
          </p>
        </AuthActionForm>
      }
    />
  );
}
