import Link from "next/link";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-settings";

export default async function NotFound() {
  const settings = await getSiteSettings();

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl items-center px-4 py-14">
        <section className="relative w-full overflow-hidden rounded-[2.6rem] border border-slate-200 bg-white/90 px-6 py-12 shadow-[0_26px_90px_rgba(15,23,42,0.08)] backdrop-blur md:px-10 md:py-16">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_60%)]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_60%)]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.34em] text-emerald-700">
                404 / Sayfa bulunamadi
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                Aradigin sayfa bu akista yok.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                Link eski olabilir, urun kaldirilmis olabilir ya da adres eksik yazilmis olabilir.
                Seni tekrar dogru rotaya hizlica alalim.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="h-12 rounded-full px-6">
                  <Link href="/">Ana sayfaya don</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-full px-6">
                  <Link href="/products">Urunleri incele</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50/90 p-6 shadow-sm">
              <div className="rounded-[1.6rem] bg-slate-950 px-5 py-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.24)]">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  Hizli yonlendirme
                </p>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <p>Siparislerini takip etmek icin hesap girisi yapabilirsin.</p>
                  <p>Kategori bazli gezinmek icin urun katalogunu kullanabilirsin.</p>
                  <p>Bir link sorunu varsa destek ekibine ulasman yeterli.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-700">
                <Link
                  href="/login"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:text-emerald-800"
                >
                  Musteri girisi
                </Link>
                <Link
                  href="/cart"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:text-emerald-800"
                >
                  Sepete don
                </Link>
                <Link
                  href="/contact"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:text-emerald-800"
                >
                  Iletisim
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings ?? {}} />
    </>
  );
}
