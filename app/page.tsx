import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [products, newArrivals, categories, banner] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: true },
      take: 8,
      orderBy: { createdAt: "desc" }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: true },
      take: 4,
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({
      where: { isActive: true },
      take: 3,
      orderBy: { createdAt: "asc" }
    }),
    prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  return (
    <>
      <Header />
      <main className="pb-16">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-10 md:grid-cols-[1.08fr_.92fr] md:items-center">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-900/5 backdrop-blur md:p-12">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
              Turkish-first commerce system
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              E-ticaret cekirdeginizi vitrine degil guvene gore kurun.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Stok, siparis, manuel odeme ve admin operasyonlari ayni cizgide
              bulusuyor. Daha rafine, daha hizli ve markaya daha uygun bir temel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">Koleksiyonu incele</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/admin">Operasyon paneli</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-3">
              <div>
                <p className="text-3xl font-black text-slate-950">7/24</p>
                <p className="mt-1 text-sm text-slate-600">Sunucu tarafinda stok ve toplam kontrolu</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-950">MVP+</p>
                <p className="mt-1 text-sm text-slate-600">Gercek siparis akisina yakin yonetim omurgasi</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-950">TR</p>
                <p className="mt-1 text-sm text-slate-600">Turkiye odakli icerik ve is akis yapisi</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-8 text-white shadow-2xl shadow-emerald-950/15 md:p-10">
            <div className="absolute -right-20 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />
            <p className="relative text-[0.72rem] font-bold uppercase tracking-[0.3em] text-emerald-100/80">
              Campaign frame
            </p>
            <h2 className="relative mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {banner?.title ?? "Premium e-ticaret altyapisi"}
            </h2>
            <p className="relative mt-3 text-base leading-7 text-emerald-50/80">
              {banner?.subtitle ??
                "Turkce oncelikli, guvenli ve ozellestirilebilir operasyon omurgasi."}
            </p>
            <div className="relative mt-8 grid gap-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100/75">
                  Checkout discipline
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Sepet toplamlari istemcide degil veritabani fiyatlariyla yeniden hesaplanir.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100/75">
                  Admin visibility
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Urun, siparis ve musteri akislarini tek panelden yonetmek icin hazir.
                </p>
              </div>
            </div>
            {!banner ? (
              <p className="relative mt-6 rounded-2xl bg-white/10 p-4 text-sm text-emerald-50/85">
                Aktif banner bulunamadi. Seed verisi ile varsayilan vitrini tekrar yukleyebilirsin.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-8 grid gap-5 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.26em] text-amber-700">
                  Category edit
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {category.name}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {category.description ??
                    "Kategori vitrini, filtrelenebilir katalog ve profesyonel urun akisi icin hazir."}
                </p>
                <span className="mt-6 inline-flex text-sm font-bold text-emerald-900 transition group-hover:translate-x-1">
                  Kategoriyi ac
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white/75 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur md:p-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
                  Featured drop
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  One cikan urunler
                </h2>
              </div>
              <Link href="/products" className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-900">
                Tum katalogu gor
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] bg-white p-8 text-slate-600 shadow-sm">
                Henuz yayinda one cikan urun yok. Gelistirme ortaminda seed verisini
                calistirabilir veya admin panelinden urun ekleyebilirsin.
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-7xl px-4">
          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 md:p-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-emerald-200/80">
                  New arrivals
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                  Yeni gelen secimler
                </h2>
              </div>
              <Link href="/products?sort=newest" className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">
                Yeni urunleri gor
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
