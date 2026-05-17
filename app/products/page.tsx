import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";

type ProductsPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: { images: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-black">Urunler</h1>
        <form className="mt-6">
          <input
            name="q"
            placeholder="Urun ara..."
            className="h-12 w-full rounded-2xl border border-slate-200 px-5"
            defaultValue={q}
          />
        </form>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {products.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-slate-600">Urun bulunamadi.</p>
        ) : null}
      </main>
    </>
  );
}
