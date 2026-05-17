import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [products, banner] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: true },
      take: 8,
      orderBy: { createdAt: "desc" }
    }),
    prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[1.1fr_.9fr] md:items-center">
          <div>
            <p className="font-bold text-brand-700">Adakan Commerce Core</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              Markaya gore ozellestirilen premium e-ticaret cekirdegi.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Stok, siparis, manuel odeme ve admin paneli hazir; kucuk ve orta
              olcekli isletmeler icin temiz temel.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg">
                <Link href="/products">Urunlere bak</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/admin">Admin demo</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <p className="text-sm text-slate-300">{banner?.subtitle ?? "Yeni sezon"}</p>
            <h2 className="mt-3 text-3xl font-black">
              {banner?.title ?? "Temiz, hizli, guvenli satis altyapisi"}
            </h2>
            <p className="mt-4 text-slate-300">
              Fiyat, stok ve siparis toplamlari server tarafinda dogrulanir.
              Client'a guvenilmez.
            </p>
            {!banner ? (
              <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
                Aktif banner bulunamadi. Gelistirme ortaminda seed verisini
                calistirarak varsayilan icerigi ekleyebilirsin.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-black">One cikan urunler</h2>
            <Link href="/products" className="text-sm font-bold">
              Tumunu gor
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-sm">
              Henuz yayinda one cikan urun yok. Gelistirme ortaminda seed
              verisini calistirabilir veya admin panelinden urun ekleyebilirsin.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
