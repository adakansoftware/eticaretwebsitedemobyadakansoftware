import Link from "next/link";
import { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-slate-950 p-6 md:block">
      <Link href="/admin" className="text-xl font-black">Adakan Admin</Link>
      <nav className="mt-8 grid gap-3 text-sm text-slate-300">
        <Link href="/admin">Dashboard</Link><Link href="/admin/products">Ürünler</Link><Link href="/admin/orders">Siparişler</Link><Link href="/admin/customers">Müşteriler</Link><Link href="/admin/settings">Site ayarları</Link><Link href="/">Mağazaya dön</Link>
      </nav>
    </aside>
    <main className="md:pl-64"><div className="mx-auto max-w-6xl p-6 md:p-10">{children}</div></main>
  </div>;
}
