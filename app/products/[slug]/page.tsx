import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/header";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
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

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-slate-100">
          <Image src={image} alt={product.name} fill className="object-cover" />
        </div>
        <div>
          <p className="font-bold text-slate-500">
            {product.category.name}
            {product.brand ? ` · ${product.brand.name}` : ""}
          </p>
          <h1 className="mt-3 text-4xl font-black">{product.name}</h1>
          <p className="mt-4 text-3xl font-black">{formatPrice(product.price.toString())}</p>
          <p className="mt-6 leading-8 text-slate-600">{product.description}</p>
          <p className="mt-6 text-sm font-bold">Stok: {product.stock}</p>
          <div className="mt-8 max-w-sm">
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </main>
    </>
  );
}
