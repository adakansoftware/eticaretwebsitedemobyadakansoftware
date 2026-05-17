import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Siparislerim</h1>
            <p className="mt-2 text-slate-600">Gecmis siparislerini ve toplamlarini buradan takip edebilirsin.</p>
          </div>
          <Link href="/account/addresses" className="font-bold text-slate-700 underline">
            Adreslerimi yonet
          </Link>
        </div>

        <div className="mt-8 grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <b>{order.orderNumber}</b>
              <p className="text-sm text-slate-600">
                {order.status} · {formatPrice(order.grandTotal.toString())}
              </p>
            </div>
          ))}

          {orders.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
              Henuz siparisin yok.
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
