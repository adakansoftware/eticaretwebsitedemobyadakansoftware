import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true }
          }
        }
      },
      products: {
        where: { isActive: true },
        include: { images: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!category || !category.isActive) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <Link href="/categories" className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-900">
            Tüm kategorilere dön
          </Link>
          <p className="mt-5 text-[0.72rem] font-bold uppercase tracking-[0.34em] text-amber-700">
            Kategori ürünleri
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            {category.name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {category.description ?? "Bu kategori altındaki aktif ürünleri inceleyebilirsiniz."}
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-500">
            {category._count.products} aktif ürün
          </p>

          {category.products.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              Bu kategoride henüz aktif ürün bulunmuyor.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
