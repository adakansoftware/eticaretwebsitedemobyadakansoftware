import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { TrustStrip } from "@/components/storefront/trust-strip";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Seçili ürünlerde güvenli ve hızlı alışveriş",
  description:
    "Telefon aksesuarlarından ofis ürünlerine kadar özenle seçilmiş ürünleri güvenli ödeme, hızlı teslimat ve kolay iade avantajıyla keşfedin."
};

export default async function HomePage() {
  const [products, newArrivals, categories, banner, settings] = await Promise.all([
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
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } }
    }),
    prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.siteSettings.findFirst()
  ]);

  return (
    <>
      <Header />
      <main className="space-y-8 pb-16">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-2 pt-10 md:grid-cols-[1.08fr_.92fr] md:items-center">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-900/5 backdrop-blur md:p-12">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
              Güvenli alışveriş
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Seçili ürünlerde güvenli ve hızlı alışveriş
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              Telefon aksesuarlarından ofis ürünlerine kadar özenle seçilmiş ürünleri güvenli
              ödeme, hızlı teslimat ve kolay iade avantajıyla keşfedin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">Alışverişe başla</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/categories">Kategorileri keşfet</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-3">
              <div>
                <p className="text-3xl font-black text-slate-950">7/24</p>
                <p className="mt-1 text-sm text-slate-600">Güvenli alışveriş</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-950">Hızlı</p>
                <p className="mt-1 text-sm text-slate-600">Hızlı teslimat</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-950">Destek</p>
                <p className="mt-1 text-sm text-slate-600">WhatsApp destek</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-8 text-white shadow-2xl shadow-emerald-950/15 md:p-10">
            <div className="absolute -right-20 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />
            <p className="relative text-[0.72rem] font-bold uppercase tracking-[0.3em] text-emerald-100/80">
              Alışveriş avantajları
            </p>
            <h2 className="relative mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {banner?.title ?? "Özenle seçilmiş ürünler, hızlı destek"}
            </h2>
            <p className="relative mt-3 text-base leading-7 text-emerald-50/80">
              {banner?.subtitle ??
                "Kapıda ödeme, EFT / Havale ve kolay sipariş akışı ile alışverişinizi rahatça tamamlayın."}
            </p>
            <div className="relative mt-8 grid gap-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100/75">
                  Güvenli alışveriş
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Siparişinizi tamamlamadan önce ürün, ödeme ve teslimat detaylarınızı kolayca gözden geçirebilirsiniz.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100/75">
                  WhatsApp destek
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {settings?.whatsappNumber
                    ? `${settings.whatsappNumber} numarası üzerinden bize ulaşabilirsiniz.`
                    : "Sipariş öncesi ve sonrası destek için bizimle hızlıca iletişime geçebilirsiniz."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <TrustStrip />

        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-8 grid gap-5 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.26em] text-amber-700">
                  Öne çıkan kategoriler
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  {category.name}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {category.description ??
                    "Bu kategori altındaki seçili ürünleri inceleyerek ihtiyacınıza uygun ürünleri keşfedin."}
                </p>
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  {category._count.products} ürün
                </p>
                <span className="mt-6 inline-flex text-sm font-bold text-emerald-900 transition group-hover:translate-x-1">
                  Kategoriyi aç
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white/75 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur md:p-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
                  Öne çıkan ürünler
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Özenle seçilmiş ürünler
                </h2>
              </div>
              <Link href="/products" className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-900">
                Tüm ürünleri gör
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
                Henüz yayında öne çıkan ürün bulunmuyor.
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4">
          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 md:p-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-emerald-200/80">
                  Yeni gelenler
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                  Son eklenen ürünler
                </h2>
              </div>
              <Link href="/products?sort=newest" className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">
                Yeni ürünleri gör
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
