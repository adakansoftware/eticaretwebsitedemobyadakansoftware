import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
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
import { formatPrice } from "@/lib/utils";

type ProductsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    stock?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
};

const sortOptions = [
  { value: "newest", label: "En yeni" },
  { value: "price-asc", label: "Fiyat artan" },
  { value: "price-desc", label: "Fiyat azalan" }
] as const;

export const metadata: Metadata = {
  title: "Urunler",
  description: "Telefon aksesuarlari, ofis urunleri ve secili kategorilerdeki urunleri kesfedin."
};

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

function parseOptionalPositiveNumber(value?: string) {
  if (!value) return undefined;

  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return undefined;
  }

  return normalized;
}

function buildEffectivePriceWhere(minPrice?: number, maxPrice?: number): Prisma.ProductWhereInput | undefined {
  const salePriceFilter =
    minPrice !== undefined || maxPrice !== undefined
      ? {
          salePrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {})
          }
        }
      : undefined;

  const regularPriceFilter =
    minPrice !== undefined || maxPrice !== undefined
      ? {
          AND: [
            { salePrice: null },
            {
              price: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {})
              }
            }
          ]
        }
      : undefined;

  if (!salePriceFilter && !regularPriceFilter) {
    return undefined;
  }

  return {
    OR: [salePriceFilter, regularPriceFilter].filter(Boolean) as Prisma.ProductWhereInput[]
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const category = resolvedSearchParams?.category?.trim();
  const brand = resolvedSearchParams?.brand?.trim();
  const stock = resolvedSearchParams?.stock?.trim();
  const sort = resolvedSearchParams?.sort?.trim() ?? "newest";
  const minPrice = parseOptionalPositiveNumber(resolvedSearchParams?.minPrice?.trim());
  const maxPrice = parseOptionalPositiveNumber(resolvedSearchParams?.maxPrice?.trim());
  const page = getPageValue(resolvedSearchParams?.page, 1);

  const effectivePriceWhere = buildEffectivePriceWhere(minPrice, maxPrice);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { searchKeywords: { contains: q, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(stock === "in-stock" ? { stock: { gt: 0 } } : {}),
    ...(effectivePriceWhere ?? {})
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
    sort,
    minPrice: minPrice !== undefined ? String(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? String(maxPrice) : undefined
  };

  const activeFilters = [
    category
      ? {
          label: `Kategori: ${categories.find((item) => item.slug === category)?.name ?? category}`,
          href: buildQueryString(currentFilters, { category: undefined })
        }
      : null,
    brand
      ? {
          label: `Marka: ${brands.find((item) => item.slug === brand)?.name ?? brand}`,
          href: buildQueryString(currentFilters, { brand: undefined })
        }
      : null,
    stock === "in-stock"
      ? {
          label: "Stokta olanlar",
          href: buildQueryString(currentFilters, { stock: undefined })
        }
      : null,
    minPrice !== undefined
      ? {
          label: `Min: ${formatPrice(minPrice)}`,
          href: buildQueryString(currentFilters, { minPrice: undefined })
        }
      : null,
    maxPrice !== undefined
      ? {
          label: `Max: ${formatPrice(maxPrice)}`,
          href: buildQueryString(currentFilters, { maxPrice: undefined })
        }
      : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="rounded-[2.6rem] border border-slate-200 bg-white/80 p-6 shadow-[0_26px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-amber-700">
                Urun katalogu
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Urunler
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Kategori, marka, stok ve fiyat filtreleriyle aradiginiz urunlere hizlica ulasin.
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
              <input type="hidden" name="category" value={category ?? ""} />
              <input type="hidden" name="brand" value={brand ?? ""} />
              <input type="hidden" name="stock" value={stock ?? ""} />
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="minPrice" value={minPrice ?? ""} />
              <input type="hidden" name="maxPrice" value={maxPrice ?? ""} />
            </form>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.24em] text-slate-900">
                    Filtreler
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Aramayi kategori, marka, fiyat ve stok sinyalleriyle hizlica daralt.
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
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

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-900">Min fiyat</label>
                    <input
                      name="minPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={minPrice}
                      placeholder="0"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-900">Max fiyat</label>
                    <input
                      name="maxPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={maxPrice}
                      placeholder="10000"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-700"
                    />
                  </div>
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
              <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {pagination.totalItems} aktif urun bulundu
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Sayfa {pagination.page} / {pagination.totalPages}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Arama: {q}
                      </span>
                    ) : null}
                    {sort !== "newest" ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        {sortOptions.find((item) => item.value === sort)?.label ?? sort}
                      </span>
                    ) : null}
                  </div>
                </div>

                {activeFilters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                      <Link
                        key={filter.label}
                        href={filter.href}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
                      >
                        {filter.label}
                        <X className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                ) : null}
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
                    {pagination.page}. sayfadasiniz
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
