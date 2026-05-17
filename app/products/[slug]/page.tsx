import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/header";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { getDiscountPercentage, getEffectiveUnitPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, category: true, brand: true }
  });

  if (!product || !product.isActive) notFound();

  const image =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30";
  const effectivePrice = getEffectiveUnitPrice(product);
  const discountPercentage = getDiscountPercentage(
    product.salePrice ?? product.price,
    product.compareAtPrice
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/products" className="hover:text-slate-900">
            Urunler
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{product.name}</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1fr_.95fr]">
          <div className="overflow-hidden rounded-[2.6rem] border border-slate-200 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
              <Image src={image} alt={product.name} fill className="object-cover" />
              {discountPercentage > 0 ? (
                <div className="absolute left-5 top-5 rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-slate-950">
                  %{discountPercentage} indirim
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2.6rem] border border-slate-200 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
              {product.category.name}
              {product.brand ? ` · ${product.brand.name}` : ""}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {product.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-black tracking-tight text-slate-950">
                {formatPrice(effectivePrice)}
              </p>
              {product.compareAtPrice ? (
                <p className="text-lg text-slate-400 line-through">
                  {formatPrice(product.compareAtPrice.toString())}
                </p>
              ) : null}
            </div>
            <p className="mt-6 text-base leading-8 text-slate-600">{product.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-emerald-900" />
                  <p className="text-sm font-bold text-slate-900">Hazir sevk akisi</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Siparis ve stok akisina uygun hizli operasyon kurulumu.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-900" />
                  <p className="text-sm font-bold text-slate-900">Server-side kontrol</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Fiyat, toplam ve stok dogrulamasi siparis aninda tekrar yapilir.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-[1.7rem] border border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Stok durumu
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">{product.stock} adet</p>
              </div>
              <span className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Aktif urun
              </span>
            </div>

            <div className="mt-8 max-w-sm">
              <AddToCartButton productId={product.id} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
