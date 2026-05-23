import type { Metadata } from "next";
import Link from "next/link";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/lib/actions/auth-actions";

export const metadata: Metadata = {
  title: "Parolami Unuttum"
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      mode="login"
      title="Parolani guvenli sekilde sifirla"
      description="Hesabina bagli e-posta adresini gir. Adres sistemde kayitliysa sana sifre sifirlama baglantisi gonderilecek."
      highlights={[
        {
          title: "Guvenli islem",
          body: "Ayni basari mesaji gosterilir; boylece bir e-postanin sistemde kayitli olup olmadigi aciga cikmaz."
        },
        {
          title: "Tek kullanimlik baglanti",
          body: "Sifirlama baglantisi 1 saat gecerli olur ve kullanildiginda kapanir.",
          tone: "accent"
        }
      ]}
      form={
        <AuthActionForm action={forgotPasswordAction} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Parolami unuttum</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hesabina bagli e-posta adresini girerek sifirlama baglantisi iste.
            </p>
          </div>

          <div className="grid gap-4">
            <Input name="email" type="email" placeholder="E-posta" required />
            <AuthSubmitButton
              className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800"
              idleLabel="Sifirlama baglantisi gonder"
              pendingLabel="Gonderiliyor..."
            />
          </div>

          <p className="text-sm text-slate-600">
            Sifreni hatirladiysan{" "}
            <Link className="font-bold text-slate-950 hover:text-emerald-700" href="/login">
              giris ekranina don
            </Link>
            .
          </p>
        </AuthActionForm>
      }
    />
  );
}
