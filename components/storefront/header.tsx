import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200 bg-white/80 px-5 py-3 shadow-lg shadow-slate-900/5 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-900 text-sm font-black text-white">
            AC
          </span>
          <span className="leading-tight">
            <span className="block text-[0.68rem] font-bold uppercase tracking-[0.28em] text-amber-700">
              Commerce Core
            </span>
            <span className="block text-base font-black tracking-tight text-slate-950">
              Adakan Commerce
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
          <Link className="transition hover:text-emerald-800" href="/products">
            Urunler
          </Link>
          <Link className="transition hover:text-emerald-800" href="/category/telefon-aksesuarlari">
            Kategoriler
          </Link>
          <Link className="transition hover:text-emerald-800" href="/legal/iletisim">
            Iletisim
          </Link>
          {user ? (
            <Link className="transition hover:text-emerald-800" href="/account/addresses">
              Adreslerim
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 transition hover:border-amber-500 hover:bg-white md:inline-flex"
            >
              Admin
            </Link>
          ) : null}

          <Link
            href={user ? "/orders" : "/login"}
            aria-label="Hesap"
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-slate-900 transition hover:-translate-y-0.5 hover:border-amber-500"
          >
            <UserRound className="h-5 w-5" />
          </Link>

          <Link
            href="/cart"
            aria-label="Sepet"
            className="grid h-11 w-11 place-items-center rounded-full bg-emerald-900 text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
