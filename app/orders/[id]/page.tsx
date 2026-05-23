import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/storefront/header";
import { requireUser } from "@/lib/auth";
import { getOrderStatusLabel, getTrackingCarrierLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siparis Detayi"
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        payment: true,
        items: true
      }
    }),
    getSiteSettings()
  ]);

  if (!order) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">Siparis detayi</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{order.orderNumber}</h1>
              <p className="mt-3 text-sm text-slate-600">
                {new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short"
                }).format(order.createdAt)}
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Durum</span>
                <span className="font-bold text-slate-950">{getOrderStatusLabel(order.status)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Odeme</span>
                <span className="font-bold text-slate-950">{order.payment?.status ?? "WAITING"}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Yontem</span>
                <span className="font-bold text-slate-950">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Urunler</h2>
              <div className="mt-6 space-y-4">
                {order.items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-4 md:grid-cols-[88px_1fr_auto]"
                  >
                    <div className="relative h-24 overflow-hidden rounded-2xl bg-slate-100">
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
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-lg font-black text-slate-950 transition hover:text-emerald-800"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.productBrand ?? "Marka yok"} · SKU {item.sku}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-bold text-slate-950">{formatPrice(item.unitPrice.toString())}</p>
                      <p className="text-sm text-slate-600">{item.quantity} adet</p>
                      <p className="mt-1 text-sm font-bold text-emerald-800">
                        {formatPrice(item.lineTotal.toString())}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {order.trackingNumber ? (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">Kargo takibi</h2>
                <div className="mt-4 grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">Firma</span>
                    <span className="font-bold text-slate-950">
                      {getTrackingCarrierLabel(order.trackingCarrier)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">Takip numarasi</span>
                    <span className="font-bold text-slate-950">{order.trackingNumber}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Teslimat bilgisi</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="font-bold text-slate-950">{order.shippingFullName}</p>
                <p>{order.shippingPhone}</p>
                <p>
                  {order.shippingCity} / {order.shippingDistrict}
                </p>
                <p className="whitespace-pre-line">{order.shippingAddress}</p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Fiyat ozeti</h2>
              <div className="mt-6 space-y-3 text-sm text-slate-700">
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
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-950">
                  <span>Genel toplam</span>
                  <span>{formatPrice(order.grandTotal.toString())}</span>
                </div>
              </div>
            </div>

            {order.status === "WAITING_PAYMENT" &&
            order.paymentMethod === "BANK_TRANSFER" &&
            settings?.bankAccountInfo ? (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="text-2xl font-black text-amber-950">Banka hesap bilgisi</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-amber-900">
                  {settings.bankAccountInfo}
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
