"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Urunler" },
  { href: "/admin/categories", label: "Kategoriler" },
  { href: "/admin/brands", label: "Markalar" },
  { href: "/admin/orders", label: "Siparisler" },
  { href: "/admin/coupons", label: "Kuponlar" },
  { href: "/admin/banners", label: "Bannerlar" },
  { href: "/admin/reviews", label: "Yorumlar" },
  { href: "/admin/inventory", label: "Envanter loglari" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/customers", label: "Musteriler" },
  { href: "/admin/settings", label: "Site ayarlari" }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_20%),linear-gradient(180deg,#020617_0%,#08111f_48%,#020617_100%)] text-slate-100">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl md:hidden">
        <div className="px-4 py-4">
          <Link
            href="/admin"
            className="block rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.18)]"
          >
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-emerald-200/80">
              Commerce operations
            </p>
            <h1 className="mt-2 text-xl font-black tracking-tight text-white">Adakan Admin</h1>
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm [&::-webkit-scrollbar]:hidden">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 font-semibold transition",
                  isActive
                    ? "border-emerald-400 bg-emerald-500 text-slate-950"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#0b1220_100%)] p-6 md:block">
        <Link
          href="/admin"
          className="block rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5 backdrop-blur"
        >
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-emerald-200/80">
            Commerce operations
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Adakan Admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Siparis, katalog ve musteri operasyonlarini tek panelden yonet.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Backoffice</span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
              Surekli kullanim
            </span>
          </div>
        </Link>

        <nav className="mt-8 grid gap-2 text-sm">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl border px-4 py-3 font-semibold transition",
                  isActive
                    ? "border-emerald-400/40 bg-emerald-500/15 text-white"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="mt-4 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-emerald-200 transition hover:bg-white/5"
          >
            Magazin vitrini
          </Link>
        </nav>
      </aside>

      <main className="md:pl-80">
        <div className="mx-auto max-w-[1600px] p-5 md:p-8 xl:p-10">
          <div className="mb-6 hidden items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur md:flex">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-slate-400">
                Admin workspace
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Operasyon, katalog ve siparis akislarini yogun kullanim odakli panelde yonet.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Canli kontrol</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                Admin yetkisi aktif
              </span>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
