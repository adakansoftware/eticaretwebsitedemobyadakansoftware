import Link from "next/link";
import { ReactNode } from "react";

const navigation = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Urunler" },
  { href: "/admin/categories", label: "Kategoriler" },
  { href: "/admin/brands", label: "Markalar" },
  { href: "/admin/orders", label: "Siparisler" },
  { href: "/admin/coupons", label: "Kuponlar" },
  { href: "/admin/banners", label: "Bannerlar" },
  { href: "/admin/inventory", label: "Envanter loglari" },
  { href: "/admin/customers", label: "Musteriler" },
  { href: "/admin/settings", label: "Site ayarlari" }
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-6 md:block">
        <Link href="/admin" className="block rounded-[1.8rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-emerald-200/80">
            Commerce operations
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Adakan Admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Siparis, katalog ve musteri operasyonlarini tek panelden yonet.
          </p>
        </Link>

        <nav className="mt-8 grid gap-2 text-sm">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-transparent px-4 py-3 font-semibold text-slate-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-3 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-emerald-200 transition hover:bg-white/5"
          >
            Magazin vitrini
          </Link>
        </nav>
      </aside>

      <main className="md:pl-72">
        <div className="mx-auto max-w-7xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
