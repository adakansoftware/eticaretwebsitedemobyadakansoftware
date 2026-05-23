import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { deleteReviewFormAction, updateReviewStatusFormAction } from "@/lib/actions/admin-review-actions";
import { prisma } from "@/lib/prisma";

type ReviewsPageProps = {
  searchParams?: Promise<{ q?: string; rating?: string; status?: string }>;
};

export default async function AdminReviewsPage({ searchParams }: ReviewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const rating = resolvedSearchParams?.rating?.trim();
  const status = resolvedSearchParams?.status?.trim();

  const reviews = await prisma.review.findMany({
    where: {
      ...(rating ? { rating: Number(rating) } : {}),
      ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
      ...(q
        ? {
            OR: [
              { body: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { product: { name: { contains: q, mode: "insensitive" } } },
              { user: { name: { contains: q, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Yorum moderasyonu</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Urun yorumlarini onaylayabilir, reddedebilir veya silebilirsin. Onayli yorumlar urun
          puan ortalamasini da otomatik gunceller.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_160px_220px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Urun veya kullanici ara"
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none"
          />
          <select
            name="rating"
            defaultValue={rating ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tum puanlar</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} yildiz
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tum durumlar</option>
            <option value="PENDING">Bekleyen</option>
            <option value="APPROVED">Onayli</option>
            <option value="REJECTED">Reddedildi</option>
          </select>
          <button className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950">
            Filtrele
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article key={review.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                    {review.product.name}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">{review.title ?? "Basliksiz yorum"}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{review.body ?? "Yorum metni yok."}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      {review.user.name}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      {review.rating} / 5
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      {review.status}
                    </span>
                  </div>
                </div>

                <div className="min-w-[280px] space-y-3">
                  <AdminActionForm action={updateReviewStatusFormAction} className="grid gap-3">
                    <input type="hidden" name="reviewId" value={review.id} />
                    <select
                      name="status"
                      defaultValue={review.status}
                      className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
                    >
                      <option value="PENDING">Bekleyen</option>
                      <option value="APPROVED">Onayla</option>
                      <option value="REJECTED">Reddet</option>
                    </select>
                    <AdminSubmitButton idleLabel="Durumu guncelle" pendingLabel="Guncelleniyor..." />
                  </AdminActionForm>

                  <AdminActionForm action={deleteReviewFormAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <ConfirmSubmitButton
                      variant="outline"
                      className="w-full"
                      confirmMessage="Bu yorumu silmek istediginize emin misiniz?"
                    >
                      Yorumu sil
                    </ConfirmSubmitButton>
                  </AdminActionForm>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Filtreye uyan yorum bulunamadi.
          </div>
        )}
      </section>
    </div>
  );
}
