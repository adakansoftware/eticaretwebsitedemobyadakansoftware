import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateAdminOrderAction } from "@/lib/actions/admin-order-actions";
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

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: true, items: true, payment: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Siparisler</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Siparis durumu, odeme durumu ve ic operasyon notlari tek panelden yonetilir.
          Detay sayfasi uzerinden adres snapshot ve urun kirilimlarini da gorebilirsin.
        </p>
      </section>

      <section className="grid gap-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <article key={order.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{order.orderNumber}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {order.user.name} · {order.shippingCity}/{order.shippingDistrict}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {order.items.map((item) => `${item.productName} x ${item.quantity}`).join(", ")}
                  </p>
                </div>

                <div className="text-left xl:text-right">
                  <p className="text-xl font-black text-white">{formatPrice(order.grandTotal.toString())}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {order.status} · {order.paymentMethod}
                  </p>
                  <p className="text-sm text-slate-400">
                    Odeme: {order.payment?.status ?? "Kayit yok"}
                  </p>
                </div>
              </div>

              <form action={updateAdminOrderAction} className="mt-5 grid gap-4">
                <input type="hidden" name="orderId" value={order.id} />

                <div className="grid gap-4 xl:grid-cols-[220px_220px_1fr_auto_auto]">
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
                    placeholder="Admin notu"
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
                  />

                  <Button className="h-11">Guncelle</Button>
                  <Button asChild variant="outline" className="h-11">
                    <Link href={`/admin/orders/${order.id}`}>Detay</Link>
                  </Button>
                </div>
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Henuz siparis yok.
          </div>
        )}
      </section>
    </div>
  );
}
