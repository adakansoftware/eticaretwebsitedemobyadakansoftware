import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          Adakan Commerce
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/products">Urunler</Link>
          <Link href="/category/telefon-aksesuarlari">Kategoriler</Link>
          <Link href="/legal/iletisim">Iletisim</Link>
          {user ? <Link href="/account/addresses">Adreslerim</Link> : null}
        </nav>
        <div className="flex items-center gap-3">
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="text-sm font-semibold">
              Admin
            </Link>
          ) : null}
          <Link href={user ? "/orders" : "/login"} aria-label="Hesap">
            <UserRound className="h-5 w-5" />
          </Link>
          <Link href="/cart" aria-label="Sepet">
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
