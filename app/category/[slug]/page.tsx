import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug }, include: { products: { where: { isActive: true }, include: { images: true } } } });
  if (!category) notFound();
  return <><Header /><main className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-3xl font-black">{category.name}</h1><p className="mt-2 text-slate-600">{category.description}</p><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{category.products.map((p) => <ProductCard key={p.id} product={p} />)}</div></main></>;
}
