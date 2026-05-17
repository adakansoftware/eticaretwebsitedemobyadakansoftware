import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product, ProductImage } from "@prisma/client";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { getDiscountPercentage, getEffectiveUnitPrice } from "@/lib/commerce";
import { formatPrice } from "@/lib/utils";

type Props = {
  product: Product & { images: ProductImage[] };
};

export function ProductCard({ product }: Props) {
  const image =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30";
  const effectivePrice = getEffectiveUnitPrice(product);
  const discountPercentage = getDiscountPercentage(
    product.salePrice ?? product.price,
    product.compareAtPrice
  );

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_22px_55px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.4] overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <span className="rounded-full border border-white/60 bg-white/85 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.22em] text-slate-900 backdrop-blur">
              {product.isFeatured ? "Öne çıkan" : "Yeni ürün"}
            </span>
            <div className="flex items-center gap-2">
              {discountPercentage > 0 ? (
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950">
                  %{discountPercentage}
                </span>
              ) : null}
              <span className="rounded-full bg-emerald-900/92 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-950/20">
                {product.stock > 0 ? "Stokta" : "Tükendi"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.26em] text-amber-700">
              Seçili ürün
            </p>
            <h3 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-slate-600">
              {product.shortDescription ??
                "Günlük kullanım için seçilmiş, güvenli sipariş akışıyla sunulan ürün."}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {product.ratingCount > 0 ? (
                <span>
                  {Number(product.ratingAverage).toFixed(1)} · {product.ratingCount} değerlendirme
                </span>
              ) : (
                <span>Değerlendirme bekleniyor</span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                Fiyat
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {formatPrice(effectivePrice)}
              </p>
              {product.compareAtPrice ? (
                <p className="mt-1 text-sm text-slate-400 line-through">
                  {formatPrice(product.compareAtPrice.toString())}
                </p>
              ) : null}
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-900">
              Hazır sevk
            </span>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <AddToCartButton productId={product.id} />
      </div>
    </article>
  );
}
