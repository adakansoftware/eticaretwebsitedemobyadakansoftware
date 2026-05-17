import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction
} from "@/lib/actions/admin-category-actions";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Kategoriler</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Kategori vitrini, SEO alanlari ve aktiflik yonetimi burada toplanir. Mevcut
          veri modelinde parent kategori destegi bulunmadigi icin bu ekran tek seviye
          katalog mantigiyla calisir.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black text-white">Yeni kategori ekle</h2>
        <CategoryForm action={createCategoryAction} submitLabel="Kategoriyi olustur" />
      </section>

      <section className="grid gap-4">
        {categories.length > 0 ? (
          categories.map((category) => (
            <article key={category.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">{category.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    /{category.slug} · {category._count.products} urun ·{" "}
                    {category.isActive ? "Aktif" : "Pasif"}
                  </p>
                </div>
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <Button variant="outline">Sil</Button>
                </form>
              </div>

              <CategoryForm
                action={updateCategoryAction}
                submitLabel="Degisiklikleri kaydet"
                categoryId={category.id}
                defaultValues={{
                  name: category.name,
                  slug: category.slug,
                  description: category.description ?? "",
                  seoTitle: category.seoTitle ?? "",
                  seoDescription: category.seoDescription ?? "",
                  imageUrl: category.imageUrl ?? "",
                  isActive: category.isActive
                }}
              />
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Henuz kategori yok. Vitrindeki urunleri duzgun segmente etmek icin ilk kategoriyi
            buradan olusturabilirsin.
          </div>
        )}
      </section>
    </div>
  );
}

type CategoryFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  categoryId?: string;
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

function CategoryForm({ action, submitLabel, categoryId, defaultValues }: CategoryFormProps) {
  return (
    <form action={action} className="mt-6 grid gap-4">
      {categoryId ? <input type="hidden" name="categoryId" value={categoryId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder="Kategori adi" defaultValue={defaultValues?.name} required />
        <Input
          name="slug"
          placeholder="Slug bos birakilirsa addan uretilir"
          defaultValue={defaultValues?.slug}
        />
      </div>

      <Input
        name="imageUrl"
        type="url"
        placeholder="Kategori gorsel URL"
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
        placeholder="Kategori aciklamasi"
        className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
      />

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        Aktif kategori olarak yayinla
      </label>

      <Button className="w-full md:w-auto">{submitLabel}</Button>
    </form>
  );
}
