import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductImage } from "@prisma/client";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

type Props = { product: Product & { images: ProductImage[] } };
export function ProductCard({ product }: Props) {
  const image = product.images[0]?.url ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30";
  return <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <Link href={`/products/${product.slug}`} className="block">
      <div className="relative aspect-square bg-slate-100"><Image src={image} alt={product.name} fill className="object-cover transition group-hover:scale-105" /></div>
      <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stok: {product.stock}</p><h3 className="mt-2 line-clamp-2 font-bold">{product.name}</h3><p className="mt-3 text-lg font-black">{formatPrice(product.price.toString())}</p></div>
    </Link>
    <div className="px-5 pb-5"><AddToCartButton productId={product.id} /></div>
  </div>;
}
