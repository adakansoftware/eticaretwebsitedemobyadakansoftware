import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { Input } from "@/components/ui/input";
import {
  createCouponFormAction,
  deleteCouponFormAction,
  updateCouponFormAction
} from "@/lib/actions/admin-coupon-actions";
import type { ActionResult } from "@/lib/action-response";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

function getCouponType(coupon: {
  discountPercent: number | null;
  discountAmount: { toString(): string } | null;
}) {
  return coupon.discountPercent ? "PERCENTAGE" : "FIXED_AMOUNT";
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Kuponlar</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Kupon mantigi checkout tarafinda her zaman sunucuda dogrulanir. Burada sadece kural
          tanimi ve operasyonel aktiflik yonetimi yapilir.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black text-white">Yeni kupon olustur</h2>
        <CouponForm action={createCouponFormAction} submitLabel="Kuponu olustur" resetOnSuccess />
      </section>

      <section className="grid gap-4">
        {coupons.length > 0 ? (
          coupons.map((coupon) => (
            <article key={coupon.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">{coupon.code}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {getCouponType(coupon) === "PERCENTAGE"
                      ? `%${coupon.discountPercent}`
                      : formatPrice(coupon.discountAmount?.toString() ?? 0)}{" "}
                    · Kullanildi {coupon.usedCount} / {coupon.usageLimit ?? "Sinirsiz"} ·{" "}
                    {coupon.isActive ? "Aktif" : "Pasif"}
                  </p>
                </div>
                <AdminActionForm action={deleteCouponFormAction}>
                  <input type="hidden" name="couponId" value={coupon.id} />
                  <ConfirmSubmitButton
                    variant="outline"
                    confirmMessage={`"${coupon.code}" kuponunu silmek istediginize emin misiniz?`}
                  >
                    Sil
                  </ConfirmSubmitButton>
                </AdminActionForm>
              </div>

              <CouponForm
                action={updateCouponFormAction}
                submitLabel="Degisiklikleri kaydet"
                couponId={coupon.id}
                defaultValues={{
                  code: coupon.code,
                  type: getCouponType(coupon),
                  value:
                    getCouponType(coupon) === "PERCENTAGE"
                      ? coupon.discountPercent ?? 0
                      : Number(coupon.discountAmount ?? 0),
                  minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : "",
                  usageLimit: coupon.usageLimit ?? "",
                  description: coupon.description ?? "",
                  startsAt: coupon.startsAt ? toDatetimeLocal(coupon.startsAt) : "",
                  endsAt: coupon.endsAt ? toDatetimeLocal(coupon.endsAt) : "",
                  isActive: coupon.isActive
                }}
              />
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Henuz kupon yok. Ilk kampanya kuralini tanimlayarak checkout promosyonlarini yonetebilirsin.
          </div>
        )}
      </section>
    </div>
  );
}

function toDatetimeLocal(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

type CouponFormProps = {
  action: (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  couponId?: string;
  resetOnSuccess?: boolean;
  defaultValues?: {
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    minOrderAmount: number | "";
    usageLimit: number | "";
    description: string;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
  };
};

function CouponForm({ action, submitLabel, couponId, resetOnSuccess, defaultValues }: CouponFormProps) {
  return (
    <AdminActionForm action={action} className="mt-6 grid gap-4" resetOnSuccess={resetOnSuccess}>
      {couponId ? <input type="hidden" name="couponId" value={couponId} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Input name="code" placeholder="HOSGELDIN50" defaultValue={defaultValues?.code} required />
        <select
          name="type"
          defaultValue={defaultValues?.type ?? "PERCENTAGE"}
          className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
        >
          <option value="PERCENTAGE">Yuzdesel indirim</option>
          <option value="FIXED_AMOUNT">Sabit tutar</option>
        </select>
        <Input
          name="value"
          type="number"
          step="0.01"
          placeholder="Indirim degeri"
          defaultValue={defaultValues?.value}
          required
        />
        <Input
          name="minOrderAmount"
          type="number"
          step="0.01"
          placeholder="Minimum sepet tutari"
          defaultValue={defaultValues?.minOrderAmount}
        />
        <Input
          name="usageLimit"
          type="number"
          placeholder="Kullanim limiti"
          defaultValue={defaultValues?.usageLimit}
        />
        <Input
          name="description"
          placeholder="Kampanya aciklamasi"
          defaultValue={defaultValues?.description}
        />
        <Input
          name="startsAt"
          type="datetime-local"
          defaultValue={defaultValues?.startsAt}
        />
        <Input name="endsAt" type="datetime-local" defaultValue={defaultValues?.endsAt} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        Aktif kupon olarak yayinla
      </label>

      <AdminSubmitButton className="w-full md:w-auto" idleLabel={submitLabel} pendingLabel="Kaydediliyor..." />
    </AdminActionForm>
  );
}
