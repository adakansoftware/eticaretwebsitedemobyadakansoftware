import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[var(--line)] bg-[rgba(255,250,243,0.78)] px-5 py-3 shadow-[0_20px_50px_rgba(47,33,20,0.08)] backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-ink)] text-sm font-black text-white">
            AC
          </span>
          <span>
            <span className="block text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[var(--brand-warm)]">
              Commerce Core
            </span>
            <span className="block text-base font-black tracking-tight text-[var(--brand-ink)]">
              Adakan Commerce
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--brand-ink)] md:flex">
          <Link className="transition hover:text-[var(--brand-deep)]" href="/products">
            Urunler
          </Link>
          <Link
            className="transition hover:text-[var(--brand-deep)]"
            href="/category/telefon-aksesuarlari"
          >
            Kategoriler
          </Link>
          <Link className="transition hover:text-[var(--brand-deep)]" href="/legal/iletisim">
            Iletisim
          </Link>
          {user ? (
            <Link
              className="transition hover:text-[var(--brand-deep)]"
              href="/account/addresses"
            >
              Adreslerim
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="hidden rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-warm)] hover:bg-white md:inline-flex"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={user ? "/orders" : "/login"}
            aria-label="Hesap"
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-white/70 text-[var(--brand-ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand-warm)]"
          >
            <UserRound className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Sepet"
            className="grid h-11 w-11 place-items-center rounded-full bg-[var(--brand-deep)] text-white shadow-[0_12px_24px_rgba(31,77,60,0.24)] transition hover:-translate-y-0.5"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
