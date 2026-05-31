import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/lib/actions/auth-actions";
import { requireUser } from "@/lib/auth";

const accountTabs = [
  { href: "/account/addresses", label: "Adresler" },
  { href: "/account/wishlist", label: "Favoriler" },
  { href: "/account/password", label: "Sifre" }
] as const;

export default async function AccountPasswordPage() {
  await requireUser();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.3em] text-amber-700">
              Hesap guvenligi
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
              Sifre ayarlari
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Hesabinin guvenligini korumak icin mevcut sifreni dogrulayip yeni sifreni buradan
              guncelleyebilirsin.
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-3">
          {accountTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                tab.href === "/account/password"
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-black text-slate-950">Sifreni degistir</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              En az 8 karakterlik yeni bir sifre kullan. Eski sifreyle ayni sifreyi tekrar secme.
            </p>

            <AuthActionForm action={changePasswordAction} className="mt-6 grid gap-4">
              <Input
                name="currentPassword"
                type="password"
                placeholder="Mevcut sifre"
                autoComplete="current-password"
                required
              />
              <Input
                name="newPassword"
                type="password"
                placeholder="Yeni sifre"
                autoComplete="new-password"
                required
              />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Yeni sifre tekrar"
                autoComplete="new-password"
                required
              />

              <AuthSubmitButton
                className="w-full md:w-auto"
                idleLabel="Sifreyi guncelle"
                pendingLabel="Guncelleniyor..."
              />
            </AuthActionForm>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 md:p-8">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.3em] text-emerald-700">
              Guvenlik notlari
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <p>Ayni sifreyi birden fazla sitede kullanma.</p>
              <p>Sifre degisikliginden sonra acik oturumlarini gozden gecirmen iyi olur.</p>
              <p>Tahmin edilmesi kolay dogum tarihi veya telefon kombinasyonlarindan kacın.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
