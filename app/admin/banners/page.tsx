import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBannerAction,
  deleteBannerAction,
  updateBannerAction
} from "@/lib/actions/admin-banner-actions";
import { prisma } from "@/lib/prisma";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Banner yonetimi</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Ana sayfa hero ve kampanya alanlarini buradan kontrol edebilirsin. Mevcut model
          basit bir banner yapisi saglar: baslik, alt baslik, gorsel, CTA ve siralama.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black text-white">Yeni banner ekle</h2>
        <BannerForm action={createBannerAction} submitLabel="Banneri olustur" />
      </section>

      <section className="grid gap-4">
        {banners.length > 0 ? (
          banners.map((banner) => (
            <article key={banner.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                <div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white">{banner.title}</h2>
                      <p className="mt-1 text-sm text-slate-300">
                        Siralama {banner.sortOrder} · {banner.isActive ? "Aktif" : "Pasif"}
                      </p>
                    </div>
                    <form action={deleteBannerAction}>
                      <input type="hidden" name="bannerId" value={banner.id} />
                      <Button variant="outline">Sil</Button>
                    </form>
                  </div>

                  <BannerForm
                    action={updateBannerAction}
                    submitLabel="Degisiklikleri kaydet"
                    bannerId={banner.id}
                    defaultValues={{
                      title: banner.title,
                      subtitle: banner.subtitle ?? "",
                      imageUrl: banner.imageUrl,
                      ctaLabel: banner.ctaLabel ?? "",
                      ctaHref: banner.ctaHref ?? "",
                      sortOrder: banner.sortOrder,
                      isActive: banner.isActive
                    }}
                  />
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200/80">
                      On izleme
                    </p>
                    <h3 className="text-2xl font-black text-white">{banner.title}</h3>
                    <p className="text-sm leading-6 text-slate-300">{banner.subtitle}</p>
                    {banner.ctaLabel ? (
                      <div className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950">
                        {banner.ctaLabel}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Henuz banner yok. Vitrin hero alanini yonetmek icin ilk banneri buradan ekleyebilirsin.
          </div>
        )}
      </section>
    </div>
  );
}

type BannerFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  bannerId?: string;
  defaultValues?: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaLabel: string;
    ctaHref: string;
    sortOrder: number;
    isActive: boolean;
  };
};

function BannerForm({ action, submitLabel, bannerId, defaultValues }: BannerFormProps) {
  return (
    <form action={action} className="mt-6 grid gap-4">
      {bannerId ? <input type="hidden" name="bannerId" value={bannerId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="title" placeholder="Banner basligi" defaultValue={defaultValues?.title} required />
        <Input
          name="subtitle"
          placeholder="Banner alt basligi"
          defaultValue={defaultValues?.subtitle}
        />
        <Input
          name="imageUrl"
          type="url"
          placeholder="Banner gorsel URL"
          defaultValue={defaultValues?.imageUrl}
          required
        />
        <Input
          name="ctaLabel"
          placeholder="CTA metni"
          defaultValue={defaultValues?.ctaLabel}
        />
        <Input
          name="ctaHref"
          type="url"
          placeholder="CTA linki"
          defaultValue={defaultValues?.ctaHref}
        />
        <Input
          name="sortOrder"
          type="number"
          placeholder="Siralama"
          defaultValue={defaultValues?.sortOrder ?? 0}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        Aktif banner olarak yayinla
      </label>

      <Button className="w-full md:w-auto">{submitLabel}</Button>
    </form>
  );
}
