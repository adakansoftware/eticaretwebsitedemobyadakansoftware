import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import {
  confirmManualPaymentFormAction,
  updateAdminOrderFormAction
} from "@/lib/actions/admin-order-actions";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const orderStatuses = [
  "PENDING",
  "WAITING_PAYMENT",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED"
] as const;

const paymentStatuses = ["WAITING", "CONFIRMED", "REJECTED", "REFUNDED"] as const;

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      payment: true,
      items: true
    }
  });

  if (!order) notFound();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-emerald-200/75">
              Order detail
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
              {order.orderNumber}
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Siparis ID: {order.id} · Musteri: {order.user.name} · {order.user.email}
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4 text-sm">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-400">Durum</span>
              <span className="font-bold text-white">{order.status}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span className="text-slate-400">Odeme</span>
              <span className="font-bold text-white">{order.payment?.status ?? "WAITING"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span className="text-slate-400">Yontem</span>
              <span className="font-bold text-white">{order.paymentMethod}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black text-white">Urunler</h2>
            <div className="mt-6 space-y-4">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-4 md:grid-cols-[88px_1fr_auto]"
                >
                  <div className="relative h-24 overflow-hidden rounded-2xl bg-white/5">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{item.productName}</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {item.productBrand ?? "Marka yok"} · SKU {item.sku}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">/{item.productSlug}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-bold text-white">{formatPrice(item.unitPrice.toString())}</p>
                    <p className="text-sm text-slate-300">{item.quantity} adet</p>
                    <p className="mt-1 text-sm font-bold text-emerald-200">
                      {formatPrice(item.lineTotal.toString())}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black text-white">Aktivite ozeti</h2>
            <div className="mt-6 space-y-4 text-sm">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                <p className="font-bold text-white">Siparis olusturuldu</p>
                <p className="mt-1 text-slate-300">
                  {new Intl.DateTimeFormat("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(order.createdAt)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                <p className="font-bold text-white">Son guncelleme</p>
                <p className="mt-1 text-slate-300">
                  {new Intl.DateTimeFormat("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(order.updatedAt)}
                </p>
              </div>
              {order.payment?.confirmedAt ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                  <p className="font-bold text-white">Odeme onaylandi</p>
                  <p className="mt-1 text-slate-300">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(order.payment.confirmedAt)}
                  </p>
                </div>
              ) : null}
              {order.inventoryRestoredAt ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                  <p className="font-bold text-white">Stok geri yuklendi</p>
                  <p className="mt-1 text-slate-300">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(order.inventoryRestoredAt)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black text-white">Operasyon formu</h2>
            <AdminActionForm action={updateAdminOrderFormAction} className="mt-6 grid gap-4">
              <input type="hidden" name="orderId" value={order.id} />

              <select
                name="status"
                defaultValue={order.status}
                className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                name="paymentStatus"
                defaultValue={order.payment?.status ?? "WAITING"}
                className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
              >
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <textarea
                name="adminNote"
                defaultValue={order.adminNote ?? ""}
                placeholder="Operasyon notu"
                className="min-h-32 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
              />

              <AdminSubmitButton idleLabel="Degisiklikleri kaydet" pendingLabel="Kaydediliyor..." />
            </AdminActionForm>

            {order.payment ? (
              <AdminActionForm action={confirmManualPaymentFormAction} className="mt-4">
                <input type="hidden" name="orderId" value={order.id} />
                <ConfirmSubmitButton
                  variant="outline"
                  className="w-full"
                  confirmMessage="Manuel odemeyi onaylamak istediginize emin misiniz?"
                >
                  Manuel odemeyi onayla
                </ConfirmSubmitButton>
              </AdminActionForm>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black text-white">Musteri ve teslimat</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Musteri</p>
                <p className="mt-1 font-bold text-white">{order.user.name}</p>
                <p>{order.user.email}</p>
                <p>{order.user.phone ?? "Telefon yok"}</p>
              </div>
              <div>
                <p className="text-slate-400">Teslimat snapshot</p>
                <p className="mt-1 font-bold text-white">{order.shippingFullName}</p>
                <p>{order.shippingPhone}</p>
                <p>
                  {order.shippingCity} / {order.shippingDistrict}
                </p>
                <p className="whitespace-pre-line">{order.shippingAddress}</p>
              </div>
              {order.customerNote ? (
                <div>
                  <p className="text-slate-400">Musteri notu</p>
                  <p className="mt-1 whitespace-pre-line">{order.customerNote}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black text-white">Toplamlar</h2>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Ara toplam</span>
                <span>{formatPrice(order.subtotal.toString())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Indirim</span>
                <span>-{formatPrice(order.discountTotal.toString())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kargo</span>
                <span>{formatPrice(order.shippingTotal.toString())}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-lg font-black text-white">
                <span>Genel toplam</span>
                <span>{formatPrice(order.grandTotal.toString())}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
