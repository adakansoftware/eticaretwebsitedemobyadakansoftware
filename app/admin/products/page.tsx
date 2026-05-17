import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction
} from "@/lib/actions/admin-actions";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminProductsPage() {
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-black">Urunler</h1>
      <p className="mt-2 text-slate-300">
        Urun ekleme, duzenleme ve kaldirma islemlerini bu ekrandan yapabilirsin.
      </p>

      <section className="mt-8 rounded-3xl bg-white/10 p-6">
        <h2 className="text-xl font-black">Yeni urun ekle</h2>
        <ProductForm
          action={createProductAction}
          submitLabel="Urunu olustur"
          categories={categories}
          brands={brands}
        />
      </section>

      <section className="mt-8 grid gap-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl bg-white/10 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">{product.name}</h2>
                <p className="text-sm text-slate-300">
                  {product.sku} · {formatPrice(product.price.toString())} · {product.stock} stok
                </p>
              </div>
              <form action={deleteProductAction}>
                <input type="hidden" name="productId" value={product.id} />
                <Button variant="outline">Urunu sil</Button>
              </form>
            </div>

            <ProductForm
              action={updateProductAction}
              submitLabel="Degisiklikleri kaydet"
              productId={product.id}
              categories={categories}
              brands={brands}
              defaultValues={{
                name: product.name,
                slug: product.slug,
                description: product.description,
                shortDescription: product.shortDescription ?? "",
                price: Number(product.price),
                compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : "",
                sku: product.sku,
                stock: product.stock,
                isActive: product.isActive,
                isFeatured: product.isFeatured,
                categoryId: product.categoryId,
                brandId: product.brandId ?? "",
                imageUrl: product.images[0]?.url ?? ""
              }}
            />
          </article>
        ))}
      </section>
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
    price: number;
    compareAtPrice: number | "";
    sku: string;
    stock: number;
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
        <Input name="name" placeholder="Urun adi" defaultValue={defaultValues?.name} required />
        <Input name="slug" placeholder="urun-slug" defaultValue={defaultValues?.slug} required />
        <Input
          name="shortDescription"
          placeholder="Kisa aciklama"
          defaultValue={defaultValues?.shortDescription}
        />
        <Input
          name="imageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues?.imageUrl}
        />
        <Input
          name="price"
          type="number"
          step="0.01"
          placeholder="Satis fiyati"
          defaultValue={defaultValues?.price}
          required
        />
        <Input
          name="compareAtPrice"
          type="number"
          step="0.01"
          placeholder="Eski fiyat"
          defaultValue={defaultValues?.compareAtPrice}
        />
        <Input name="sku" placeholder="SKU" defaultValue={defaultValues?.sku} required />
        <Input
          name="stock"
          type="number"
          placeholder="Stok"
          defaultValue={defaultValues?.stock}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="categoryId"
          defaultValue={defaultValues?.categoryId}
          className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          required
        >
          <option value="">Kategori sec</option>
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
          One cikan
        </label>
      </div>

      <Button className="w-full md:w-auto">{submitLabel}</Button>
    </form>
  );
}
