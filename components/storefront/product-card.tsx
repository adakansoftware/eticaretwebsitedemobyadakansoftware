import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductImage } from "@prisma/client";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

type Props = { product: Product & { images: ProductImage[] } };

export function ProductCard({ product }: Props) {
  const image =
    product.images[0]?.url ??
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30";

  return (
    <div className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-900 backdrop-blur">
              Featured
            </span>
            <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-bold text-white">
              {product.stock} stok
            </span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-amber-700">
            Adakan Select
          </p>
          <h3 className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-950">
            {product.name}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {product.shortDescription ?? "Guncel koleksiyondan secilmis premium urun."}
          </p>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Satis fiyati
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {formatPrice(product.price.toString())}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-900">
              Hazir sevk
            </span>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <AddToCartButton productId={product.id} />
      </div>
    </div>
  );
}
