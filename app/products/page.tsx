import { Search } from "lucide-react";
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
        <section className="rounded-[2.6rem] border border-slate-200 bg-white/80 p-6 shadow-[0_26px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-amber-700">
                Full collection
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Urunler
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Katalogu tarayabilir, arama yapabilir ve aktif urunleri daha rafine
                bir vitrin duzeninde inceleyebilirsin.
              </p>
            </div>

            <form className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                placeholder="Urun ara..."
                className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-5 text-sm outline-none transition focus:border-emerald-700"
                defaultValue={q}
              />
            </form>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-slate-600">
              Bu filtreyle eslesen aktif urun bulunamadi.
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
