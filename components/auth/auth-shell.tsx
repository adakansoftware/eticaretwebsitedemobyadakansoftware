import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  mode: "login" | "register";
  title: string;
  description: string;
  form: ReactNode;
  navigation?: ReactNode;
};

export function AuthShell({ mode, title, description, form, navigation }: AuthShellProps) {
  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_30%)] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:p-10">
          <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-black text-slate-950">
                A
              </span>
              <span>
                <span className="block text-[0.7rem] font-bold uppercase tracking-[0.32em] text-emerald-200/80">
                  Secure commerce
                </span>
                <span className="block text-lg font-black tracking-tight">Adakan Commerce</span>
              </span>
            </Link>

            <div className="mt-10 max-w-xl">
              <p className="text-[0.74rem] font-bold uppercase tracking-[0.32em] text-emerald-200/85">
                {isLogin ? "Hesap girisi" : "Yeni uyelik"}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-4 text-base leading-7 text-slate-300">{description}</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm font-bold text-white">Musteri akisi</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Siparislerini takip et, adreslerini yonet ve favorilerini tek hesapta tut.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-emerald-400/20 bg-emerald-500/10 p-5 backdrop-blur">
                <p className="text-sm font-bold text-emerald-100">Admin akisi</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                  Admin hesaplari bu ekrandan giris yapar ama yeni admin uyeligi buradan acilmaz.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
          {navigation ?? (
            <div className="flex items-center justify-between gap-3 rounded-full border border-slate-200 bg-slate-50 p-1">
              <Link
                href="/login"
                className={`flex-1 rounded-full px-4 py-3 text-center text-sm font-bold transition ${
                  isLogin ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Giris yap
              </Link>
              <Link
                href="/register"
                className={`flex-1 rounded-full px-4 py-3 text-center text-sm font-bold transition ${
                  !isLogin ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Uye ol
              </Link>
            </div>
          )}

          <div className="mt-8">{form}</div>
        </section>
      </div>
    </main>
  );
}
