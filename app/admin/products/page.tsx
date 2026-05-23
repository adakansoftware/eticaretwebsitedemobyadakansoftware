import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction
} from "@/lib/actions/admin-actions";
import { DEFAULT_PAGE_SIZE, getPageValue, getPagination, getPaginationMeta } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type AdminProductsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    status?: string;
    stock?: string;
    page?: string;
  }>;
};

function buildProductLink(
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
  return query ? `/admin/products?${query}` : "/admin/products";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const category = resolvedSearchParams?.category?.trim();
  const brand = resolvedSearchParams?.brand?.trim();
  const status = resolvedSearchParams?.status?.trim();
  const stock = resolvedSearchParams?.stock?.trim();
  const page = getPageValue(resolvedSearchParams?.page, 1);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(category ? { categoryId: category } : {}),
    ...(brand ? { brandId: brand } : {}),
    ...(status === "active" ? { isActive: true } : status === "passive" ? { isActive: false } : {}),
    ...(stock === "in-stock" ? { stock: { gt: 0 } } : stock === "low-stock" ? { stock: { lte: 5 } } : {})
  };

  const [categories, brands, totalItems, products] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" },
      ...getPagination(page, DEFAULT_PAGE_SIZE)
    })
  ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);
  const currentFilters = { q, category, brand, status, stock };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Ürünler</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Ürün kataloğunu arama, filtreleme, fiyat, SEO ve stok alanlarıyla tek panelden yönet.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black text-white">Yeni ürün ekle</h2>
        <ProductForm
          action={createProductAction}
          submitLabel="Ürünü oluştur"
          categories={categories}
          brands={brands}
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-4 xl:grid-cols-[1fr_220px_220px_180px_180px_auto]">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Ürün adı, SKU veya slug ara"
            className="border-white/10 bg-slate-950 text-white ring-white/10"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            name="brand"
            defaultValue={brand ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm markalar</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm durumlar</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>
          <select
            name="stock"
            defaultValue={stock ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm stoklar</option>
            <option value="in-stock">Stokta olanlar</option>
            <option value="low-stock">Düşük stok</option>
          </select>
          <Button className="w-full xl:w-auto">Filtrele</Button>
        </form>
      </section>

      <section className="grid gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <article key={product.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-white">{product.name}</h2>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                      {product.isActive ? "Aktif" : "Pasif"}
                    </span>
                    {product.isFeatured ? (
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                        Öne çıkan
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {product.sku} · {formatPrice(product.salePrice?.toString() ?? product.price.toString())} ·{" "}
                    {product.stock} stok
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {product.category.name}
                    {product.brand ? ` · ${product.brand.name}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/products/${product.slug}`}>Storefront</Link>
                  </Button>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                      Ürünü sil
                    </Button>
                  </form>
                </div>
              </div>

              <ProductForm
                action={updateProductAction}
                submitLabel="Değişiklikleri kaydet"
                productId={product.id}
                categories={categories}
                brands={brands}
                defaultValues={{
                  name: product.name,
                  slug: product.slug,
                  description: product.description,
                  shortDescription: product.shortDescription ?? "",
                  seoTitle: product.seoTitle ?? "",
                  seoDescription: product.seoDescription ?? "",
                  barcode: product.barcode ?? "",
                  price: Number(product.price),
                  salePrice: product.salePrice ? Number(product.salePrice) : "",
                  compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : "",
                  sku: product.sku,
                  stock: product.stock,
                  lowStockThreshold: product.lowStockThreshold,
                  isActive: product.isActive,
                  isFeatured: product.isFeatured,
                  categoryId: product.categoryId,
                  brandId: product.brandId ?? "",
                  imageUrl: product.images[0]?.url ?? ""
                }}
              />
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Filtreye uyan ürün bulunamadı.
          </div>
        )}
      </section>

      {pagination.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <Link
            href={buildProductLink(currentFilters, {
              page: pagination.hasPreviousPage ? String(page - 1) : String(page)
            })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasPreviousPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Önceki
          </Link>
          <p className="text-sm text-slate-300">
            Sayfa {pagination.page} / {pagination.totalPages}
          </p>
          <Link
            href={buildProductLink(currentFilters, {
              page: pagination.hasNextPage ? String(page + 1) : String(page)
            })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasNextPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Sonraki
          </Link>
        </section>
      ) : null}
    </div>
  );
}

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  productId?: string;
  defaultValues?: {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    seoTitle: string;
    seoDescription: string;
    barcode: string;
    price: number;
    salePrice: number | "";
    compareAtPrice: number | "";
    sku: string;
    stock: number;
    lowStockThreshold: number;
    isActive: boolean;
    isFeatured: boolean;
    categoryId: string;
    brandId: string;
    imageUrl: string;
  };
};

function ProductForm({
  action,
  submitLabel,
  categories,
  brands,
  productId,
  defaultValues
}: ProductFormProps) {
  return (
    <form action={action} className="mt-6 grid gap-4">
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder="Ürün adı" defaultValue={defaultValues?.name} required />
        <Input name="slug" placeholder="urun-slug" defaultValue={defaultValues?.slug} required />
        <Input
          name="shortDescription"
          placeholder="Kısa açıklama"
          defaultValue={defaultValues?.shortDescription}
        />
        <Input name="barcode" placeholder="Barcode" defaultValue={defaultValues?.barcode} />
        <Input
          name="imageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues?.imageUrl}
        />
        <Input name="sku" placeholder="SKU" defaultValue={defaultValues?.sku} required />
        <Input
          name="price"
          type="number"
          step="0.01"
          placeholder="Liste fiyatı"
          defaultValue={defaultValues?.price}
          required
        />
        <Input
          name="salePrice"
          type="number"
          step="0.01"
          placeholder="İndirimli satış fiyatı"
          defaultValue={defaultValues?.salePrice}
        />
        <Input
          name="compareAtPrice"
          type="number"
          step="0.01"
          placeholder="Eski fiyat"
          defaultValue={defaultValues?.compareAtPrice}
        />
        <Input name="stock" type="number" placeholder="Stok" defaultValue={defaultValues?.stock} required />
        <Input
          name="lowStockThreshold"
          type="number"
          placeholder="Düşük stok eşiği"
          defaultValue={defaultValues?.lowStockThreshold ?? 5}
          required
        />
        <Input
          name="seoTitle"
          placeholder="SEO başlığı"
          defaultValue={defaultValues?.seoTitle}
        />
      </div>

      <Input
        name="seoDescription"
        placeholder="SEO açıklaması"
        defaultValue={defaultValues?.seoDescription}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="categoryId"
          defaultValue={defaultValues?.categoryId}
          className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          required
        >
          <option value="">Kategori seç</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          name="brandId"
          defaultValue={defaultValues?.brandId}
          className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
        >
          <option value="">Marka seç</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="description"
        defaultValue={defaultValues?.description}
        placeholder="Ürün açıklaması"
        required
        className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
      />

      <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
          Aktif
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={defaultValues?.isFeatured ?? false}
          />
          Öne çıkan
        </label>
      </div>

      <Button className="w-full md:w-auto">{submitLabel}</Button>
    </form>
  );
}
