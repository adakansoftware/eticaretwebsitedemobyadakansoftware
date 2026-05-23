import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { requireUser } from "@/lib/auth";
import { getOrderStatusLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siparislerim"
};

function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case "CONFIRMED":
      return "Odeme onaylandi";
    case "REJECTED":
      return "Odeme reddedildi";
    case "REFUNDED":
      return "Odeme iade edildi";
    case "WAITING":
    default:
      return "Odeme bekleniyor";
  }
}

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { payment: true },
    orderBy: { createdAt: "desc" }
  });

  const activeOrders = orders.filter((order) =>
    ["PENDING", "WAITING_PAYMENT", "PAID", "PREPARING", "SHIPPED"].includes(order.status)
  ).length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Siparislerim</h1>
            <p className="mt-2 text-slate-600">
              Gecmis siparislerini, odeme durumlarini ve detay ekranlarini buradan takip edebilirsin.
            </p>
          </div>
          <Link href="/account/addresses" className="font-bold text-slate-700 underline">
            Adreslerimi yonet
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.8rem] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Toplam siparis</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{orders.length}</p>
          </div>
          <div className="rounded-[1.8rem] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Aktif takip</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{activeOrders}</p>
          </div>
          <div className="rounded-[1.8rem] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Toplam harcama</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatPrice(totalSpent)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[2rem] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-slate-950">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getOrderStatusLabel(order.status)} / {formatPrice(order.grandTotal.toString())}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                    {getPaymentStatusLabel(order.payment?.status)}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Detay
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {orders.length === 0 ? (
            <p className="rounded-[2rem] bg-white p-6 text-slate-600 shadow-sm">Henuz siparisin yok.</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
