import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Input } from "@/components/ui/input";
import {
  createBrandAction,
  deleteBrandAction,
  updateBrandAction
} from "@/lib/actions/admin-brand-actions";
import { prisma } from "@/lib/prisma";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Markalar</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Marka vitrini, slug, SEO ve aktiflik ayarlariyla katalog hiyerarsisini daha profesyonel
          yonetebilirsin.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black text-white">Yeni marka ekle</h2>
        <BrandForm action={createBrandAction} submitLabel="Markayi olustur" />
      </section>

      <section className="grid gap-4">
        {brands.length > 0 ? (
          brands.map((brand) => (
            <article key={brand.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">{brand.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    /{brand.slug} · {brand._count.products} urun · {brand.isActive ? "Aktif" : "Pasif"}
                  </p>
                </div>
                <form action={deleteBrandAction}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <Button variant="outline">Sil</Button>
                </form>
              </div>

              <BrandForm
                action={updateBrandAction}
                submitLabel="Degisiklikleri kaydet"
                brandId={brand.id}
                defaultValues={{
                  name: brand.name,
                  slug: brand.slug,
                  description: brand.description ?? "",
                  seoTitle: brand.seoTitle ?? "",
                  seoDescription: brand.seoDescription ?? "",
                  imageUrl: brand.imageUrl ?? "",
                  isActive: brand.isActive
                }}
              />
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Henuz marka yok. Marka bazli merchandising ve filtreleme icin ilk markayi buradan ekle.
          </div>
        )}
      </section>
    </div>
  );
}

type BrandFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  brandId?: string;
  defaultValues?: {
    name: string;
    slug: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    imageUrl: string;
    isActive: boolean;
  };
};

function BrandForm({ action, submitLabel, brandId, defaultValues }: BrandFormProps) {
  return (
    <form action={action} className="mt-6 grid gap-4">
      {brandId ? <input type="hidden" name="brandId" value={brandId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder="Marka adi" defaultValue={defaultValues?.name} required />
        <Input
          name="slug"
          placeholder="Slug bos birakilirsa addan uretilir"
          defaultValue={defaultValues?.slug}
        />
      </div>

      <ImageUploadField
        name="imageUrl"
        folder="brands"
        placeholder="Marka logo veya gorsel URL"
        defaultValue={defaultValues?.imageUrl}
      />
      <Input
        name="seoTitle"
        placeholder="SEO basligi"
        defaultValue={defaultValues?.seoTitle}
      />
      <Input
        name="seoDescription"
        placeholder="SEO aciklamasi"
        defaultValue={defaultValues?.seoDescription}
      />

      <textarea
        name="description"
        defaultValue={defaultValues?.description}
        placeholder="Marka aciklamasi"
        className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
      />

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        Aktif marka olarak yayinla
      </label>

      <Button className="w-full md:w-auto">{submitLabel}</Button>
    </form>
  );
}
