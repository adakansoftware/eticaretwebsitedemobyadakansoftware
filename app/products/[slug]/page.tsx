import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Star, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/header";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { getCurrentUser } from "@/lib/auth";
import { getDiscountPercentage, getEffectiveUnitPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: true,
      category: true,
      brand: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!product || !product.isActive) notFound();

  const image =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30";
  const isWishlisted = user
    ? Boolean(
        await prisma.wishlistItem.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id
            }
          }
        })
      )
    : false;
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
            Ürünler
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{product.name}</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1fr_.95fr]">
          <div className="overflow-hidden rounded-[2.6rem] border border-slate-200 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
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
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {product.ratingCount > 0 ? (
                <span>
                  {Number(product.ratingAverage).toFixed(1)} puan · {product.ratingCount} yorum
                </span>
              ) : (
                <span>İlk değerlendiren sen olabilirsin</span>
              )}
            </div>
            <p className="mt-6 text-base leading-8 text-slate-600">{product.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-emerald-900" />
                  <p className="text-sm font-bold text-slate-900">Hazır sevk</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Siparişiniz hazırlık sürecine hızlıca alınır.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-900" />
                  <p className="text-sm font-bold text-slate-900">Güvenli sipariş</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Siparişinizi tamamlamadan önce fiyat ve stok bilgileri kontrol edilir.
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
                Aktif ürün
              </span>
            </div>

            <div className="mt-8 grid max-w-md gap-3">
              <AddToCartButton productId={product.id} />
              <WishlistButton
                productId={product.id}
                productSlug={product.slug}
                isAuthenticated={Boolean(user)}
                isWishlisted={isWishlisted}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.4rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.3em] text-amber-700">
                Müşteri yorumları
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Müşteri yorumları
              </h2>
            </div>
            <p className="text-sm text-slate-500">Yalnızca onaylı yorumlar vitrinde görünür.</p>
          </div>

          <div className="mt-6 grid gap-4">
            {product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <article key={review.id} className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        {review.title ?? "Müşteri deneyimi"}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {review.body ?? "Bu yorum için detay metni yok."}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-bold text-slate-950">{review.user.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{review.rating} / 5 puan</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                Henüz onaylı yorum yok.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
