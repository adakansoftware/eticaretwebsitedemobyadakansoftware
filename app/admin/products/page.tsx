import Link from "next/link";
import type { ActionResult } from "@/lib/action-response";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ProductMediaVariantFields } from "@/components/admin/product-media-variant-fields";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import {
  AdminFilterBar,
  AdminKpiStrip,
  AdminListItem,
  AdminPageHeader,
  AdminPanel
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProductFormAction,
  deleteProductFormAction,
  updateProductFormAction
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

const inputClass =
  "border-white/10 bg-slate-950/80 text-white placeholder:text-slate-500 ring-white/10";
const selectClass =
  "h-11 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition focus:ring-4 focus:ring-white/10";
const textareaClass =
  "min-h-32 w-full rounded-[1.4rem] border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none transition focus:ring-4 focus:ring-white/10";

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

  const [categories, brands, totalItems, products, activeProductCount, featuredCount, lowStockCount] =
    await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: [{ name: "asc" }, { value: "asc" }] }
        },
        orderBy: { createdAt: "desc" },
        ...getPagination(page, DEFAULT_PAGE_SIZE)
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isFeatured: true } }),
      prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } })
    ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);
  const currentFilters = { q, category, brand, status, stock };
  const kpis = [
    {
      label: "Aktif Urun",
      value: activeProductCount,
      hint: "Vitrinde gorunen katalog",
      tone: "good" as const
    },
    {
      label: "One Cikan",
      value: featuredCount,
      hint: "Vitrin vurgusu alan urunler"
    },
    {
      label: "Dusuk Stok",
      value: lowStockCount,
      hint: "Mudahale bekleyen SKU sayisi",
      tone: lowStockCount > 0 ? ("warn" as const) : ("default" as const)
    },
    {
      label: "Filtre Sonucu",
      value: totalItems,
      hint: `Sayfa ${pagination.page} / ${pagination.totalPages}`
    }
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Catalog control"
        title="Katalogu sadece yonetilen degil rahatca taranan bir yapıya cevir"
        description="Urun olusturma, filtreleme ve stok takibini ayni dilde toparlayip katalog operasyonunu daha profesyonel hale getiriyoruz."
      />

      <AdminKpiStrip items={kpis} />

      <div className="grid gap-6 2xl:grid-cols-[.92fr_1.08fr]">
        <AdminPanel
          title="Yeni urun ekle"
          description="Yeni SKU acarken kritik alanlari tek formda, net bir akista tamamla."
        >
          <ProductForm
            action={createProductFormAction}
            submitLabel="Urunu olustur"
            categories={categories}
            brands={brands}
            resetOnSuccess
          />
        </AdminPanel>

        <AdminPanel
          title="Filtreler"
          description="Ad, SKU, kategori, marka ve stok sinyallerine gore katalogu aninda daralt."
        >
          <AdminFilterBar>
            <form className="grid gap-4 xl:grid-cols-[1.1fr_220px_220px_180px_180px_auto]">
              <Input
                name="q"
                defaultValue={q}
                placeholder="Urun adi, SKU veya slug ara"
                className={inputClass}
              />
              <select name="category" defaultValue={category ?? ""} className={selectClass}>
                <option value="">Tum kategoriler</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select name="brand" defaultValue={brand ?? ""} className={selectClass}>
                <option value="">Tum markalar</option>
                {brands.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select name="status" defaultValue={status ?? ""} className={selectClass}>
                <option value="">Tum durumlar</option>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
              </select>
              <select name="stock" defaultValue={stock ?? ""} className={selectClass}>
                <option value="">Tum stoklar</option>
                <option value="in-stock">Stokta olanlar</option>
                <option value="low-stock">Dusuk stok</option>
              </select>
              <Button className="w-full bg-white text-slate-950 hover:bg-slate-200 xl:w-auto">
                Filtrele
              </Button>
            </form>
          </AdminFilterBar>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Urun listesi"
        description="Kartlari daha yonetsel bir duzende toparlayip fiyat, stok ve SEO alanlarini net bolgelere ayirdik."
      >
        <div className="space-y-4">
          {products.length > 0 ? (
            products.map((product) => (
              <AdminListItem key={product.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-white">{product.name}</h2>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-300">
                        {product.isActive ? "Aktif" : "Pasif"}
                      </span>
                      {product.isFeatured ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-amber-100">
                          One cikan
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-300">
                      {product.sku} · {product.category.name}
                      {product.brand ? ` · ${product.brand.name}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                        Fiyat {formatPrice(product.price.toString())}
                      </span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                        Satis {formatPrice(product.salePrice?.toString() ?? product.price.toString())}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                        Stok {product.stock}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                        {product.images.length} gorsel / {product.variants.length} varyant
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Link href={`/products/${product.slug}`}>Storefront</Link>
                    </Button>
                    <AdminActionForm action={deleteProductFormAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <ConfirmSubmitButton
                        type="submit"
                        variant="outline"
                        className="border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                        confirmMessage="Bu urunu silmek istediginize emin misiniz?"
                      >
                        Urunu sil
                      </ConfirmSubmitButton>
                    </AdminActionForm>
                  </div>
                </div>

                <ProductForm
                  action={updateProductFormAction}
                  submitLabel="Degisiklikleri kaydet"
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
                    imageUrls: product.images.map((image) => image.url),
                    variants: product.variants.map((variant) => ({
                      name: variant.name,
                      value: variant.value,
                      sku: variant.sku,
                      barcode: variant.barcode ?? "",
                      stock: variant.stock,
                      priceDiff: Number(variant.priceDiff)
                    }))
                  }}
                />
              </AdminListItem>
            ))
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-white/15 px-5 py-8 text-sm text-slate-300">
              Filtreye uyan urun bulunamadi.
            </div>
          )}
        </div>
      </AdminPanel>

      {pagination.totalPages > 1 ? (
        <AdminPanel>
          <div className="flex items-center justify-between gap-4">
            <Link
              href={buildProductLink(currentFilters, {
                page: pagination.hasPreviousPage ? String(page - 1) : String(page)
              })}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                pagination.hasPreviousPage
                  ? "bg-white text-slate-950"
                  : "pointer-events-none bg-white/10 text-slate-500"
              }`}
            >
              Onceki
            </Link>
            <p className="text-sm text-slate-300">
              Sayfa {pagination.page} / {pagination.totalPages}
            </p>
            <Link
              href={buildProductLink(currentFilters, {
                page: pagination.hasNextPage ? String(page + 1) : String(page)
              })}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                pagination.hasNextPage
                  ? "bg-white text-slate-950"
                  : "pointer-events-none bg-white/10 text-slate-500"
              }`}
            >
              Sonraki
            </Link>
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}

type ProductFormProps = {
  action: (
    state: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  submitLabel: string;
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  productId?: string;
  resetOnSuccess?: boolean;
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
    imageUrls: string[];
    variants: Array<{
      name: string;
      value: string;
      sku: string;
      barcode: string;
      stock: number;
      priceDiff: number;
    }>;
  };
};

function ProductForm({
  action,
  submitLabel,
  categories,
  brands,
  productId,
  resetOnSuccess = false,
  defaultValues
}: ProductFormProps) {
  return (
    <AdminActionForm action={action} className="mt-6 grid gap-4" resetOnSuccess={resetOnSuccess}>
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder="Urun adi" defaultValue={defaultValues?.name} required className={inputClass} />
        <Input name="slug" placeholder="urun-slug" defaultValue={defaultValues?.slug} required className={inputClass} />
        <Input
          name="shortDescription"
          placeholder="Kisa aciklama"
          defaultValue={defaultValues?.shortDescription}
          className={inputClass}
        />
        <Input name="barcode" placeholder="Barcode" defaultValue={defaultValues?.barcode} className={inputClass} />
        <Input name="sku" placeholder="SKU" defaultValue={defaultValues?.sku} required className={inputClass} />
        <Input
          name="price"
          type="number"
          step="0.01"
          placeholder="Liste fiyati"
          defaultValue={defaultValues?.price}
          required
          className={inputClass}
        />
        <Input
          name="salePrice"
          type="number"
          step="0.01"
          placeholder="Indirimli satis fiyati"
          defaultValue={defaultValues?.salePrice}
          className={inputClass}
        />
        <Input
          name="compareAtPrice"
          type="number"
          step="0.01"
          placeholder="Eski fiyat"
          defaultValue={defaultValues?.compareAtPrice}
          className={inputClass}
        />
        <Input
          name="stock"
          type="number"
          placeholder="Stok"
          defaultValue={defaultValues?.stock}
          required
          className={inputClass}
        />
        <Input
          name="lowStockThreshold"
          type="number"
          placeholder="Dusuk stok esigi"
          defaultValue={defaultValues?.lowStockThreshold ?? 5}
          required
          className={inputClass}
        />
        <Input
          name="seoTitle"
          placeholder="SEO basligi"
          defaultValue={defaultValues?.seoTitle}
          className={inputClass}
        />
      </div>

      <Input
        name="seoDescription"
        placeholder="SEO aciklamasi"
        defaultValue={defaultValues?.seoDescription}
        className={inputClass}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <select name="categoryId" defaultValue={defaultValues?.categoryId} className={selectClass} required>
          <option value="">Kategori sec</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select name="brandId" defaultValue={defaultValues?.brandId} className={selectClass}>
          <option value="">Marka sec</option>
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
        placeholder="Urun aciklamasi"
        required
        className={textareaClass}
      />

      <ProductMediaVariantFields
        defaultImageUrls={defaultValues?.imageUrls}
        defaultVariants={defaultValues?.variants}
      />

      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200 md:flex-row md:items-center">
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
          One cikan
        </label>
      </div>

      <AdminSubmitButton
        className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300 md:w-auto"
        idleLabel={submitLabel}
        pendingLabel="Kaydediliyor..."
      />
    </AdminActionForm>
  );
}
