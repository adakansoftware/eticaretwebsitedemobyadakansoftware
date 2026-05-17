import Link from "next/link";
import { Search } from "lucide-react";
import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PAGE_SIZE,
  getPagination,
  getPaginationMeta,
  getPageValue
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type ProductsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    stock?: string;
    sort?: string;
    page?: string;
  }>;
};

const sortOptions = [
  { value: "newest", label: "En yeni" },
  { value: "price-asc", label: "Fiyat artan" },
  { value: "price-desc", label: "Fiyat azalan" }
] as const;

function buildQueryString(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...current, ...updates })) {
    if (value) params.set(key, value);
  }

  if (!updates.page) {
    params.delete("page");
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const category = resolvedSearchParams?.category?.trim();
  const brand = resolvedSearchParams?.brand?.trim();
  const stock = resolvedSearchParams?.stock?.trim();
  const sort = resolvedSearchParams?.sort?.trim() ?? "newest";
  const page = getPageValue(resolvedSearchParams?.page, 1);

  const where = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { searchKeywords: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(stock === "in-stock" ? { stock: { gt: 0 } } : {})
  };

  const orderBy =
    sort === "price-asc"
      ? [{ salePrice: "asc" as const }, { price: "asc" as const }]
      : sort === "price-desc"
        ? [{ salePrice: "desc" as const }, { price: "desc" as const }]
        : [{ createdAt: "desc" as const }];

  const [categories, brands, totalItems, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true }
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true }
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { images: true },
      orderBy,
      ...getPagination(page, DEFAULT_PAGE_SIZE)
    })
  ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);
  const currentFilters = {
    q,
    category,
    brand,
    stock,
    sort
  };

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
                Urun katalodu
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Kategori, marka, stok ve fiyat ekseninde daha ciddi bir vitrin deneyimi.
                Arama, filtre ve siralama ayarlari tek katalog akisinda calisir.
              </p>
            </div>

            <form className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                placeholder="Urun, SKU veya aciklama ara..."
                className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-5 text-sm outline-none transition focus:border-emerald-700"
                defaultValue={q}
              />
            </form>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.24em] text-slate-900">
                  Filtreler
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Aktif katalog, ticari odakli filtreleme ve hizli arama ile sunuluyor.
                </p>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">Kategori</label>
                  <select
                    name="category"
                    defaultValue={category ?? ""}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-700"
                  >
                    <option value="">Tum kategoriler</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">Marka</label>
                  <select
                    name="brand"
                    defaultValue={brand ?? ""}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-700"
                  >
                    <option value="">Tum markalar</option>
                    {brands.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">Stok durumu</label>
                  <select
                    name="stock"
                    defaultValue={stock ?? ""}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-700"
                  >
                    <option value="">Tum urunler</option>
                    <option value="in-stock">Sadece stokta olanlar</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">Siralama</label>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-700"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input type="hidden" name="q" value={q ?? ""} />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Uygula
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/products">Sifirla</Link>
                  </Button>
                </div>
              </form>
            </aside>

            <div>
              <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {pagination.totalItems} aktif urun bulundu
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sayfa {pagination.page} / {pagination.totalPages}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {category ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Kategori: {categories.find((item) => item.slug === category)?.name ?? category}
                    </span>
                  ) : null}
                  {brand ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Marka: {brands.find((item) => item.slug === brand)?.name ?? brand}
                    </span>
                  ) : null}
                  {stock === "in-stock" ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                      Stokta olanlar
                    </span>
                  ) : null}
                </div>
              </div>

              {products.length > 0 ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                  Bu filtre kombinasyonuyla eslesen aktif urun bulunamadi.
                </div>
              )}

              {pagination.totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <Button
                    asChild
                    variant="outline"
                    className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                  >
                    <Link
                      href={buildQueryString(currentFilters, {
                        page: pagination.hasPreviousPage ? String(page - 1) : String(page)
                      })}
                    >
                      Onceki
                    </Link>
                  </Button>

                  <p className="text-sm font-semibold text-slate-600">
                    {pagination.page}. sayfadasin
                  </p>

                  <Button
                    asChild
                    variant="outline"
                    className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                  >
                    <Link
                      href={buildQueryString(currentFilters, {
                        page: pagination.hasNextPage ? String(page + 1) : String(page)
                      })}
                    >
                      Sonraki
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
