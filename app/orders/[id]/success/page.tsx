import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { getOrderStatusLabel } from "@/lib/order-labels";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siparis Alindi"
};

type OrderSuccessPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true, payment: true }
    }),
    getSiteSettings()
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black">Siparis alindi</h1>
          {order ? (
            <>
              <p className="mt-3 text-slate-600">
                Siparis no: <b>{order.orderNumber}</b>
              </p>
              <p className="mt-2 text-slate-700">
                Toplam: <b>{formatPrice(order.grandTotal.toString())}</b>
              </p>
              <p className="mt-2 text-slate-700">
                Durum: <b>{getOrderStatusLabel(order.status)}</b>
              </p>
              <p className="mt-2 text-slate-700">
                Odeme yontemi: <b>{order.paymentMethod}</b>
              </p>

              {order.paymentMethod === "BANK_TRANSFER" && settings?.bankAccountInfo ? (
                <div className="mt-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 p-5">
                  <p className="font-bold text-amber-950">Banka hesap bilgisi</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">
                    {settings.bankAccountInfo}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Siparisimi takip et
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Alisverise devam et
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-4 text-slate-600">Siparis bulunamadi.</p>
          )}
        </div>
      </main>
    </>
  );
}
