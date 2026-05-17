import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/lib/actions/admin-actions";
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

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: true, items: true, payment: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="text-3xl font-black">Siparisler</h1>
      <p className="mt-2 text-slate-300">
        Siparis durumlarini guncelle, operasyon notu ekle ve odeme akisini tek yerden yonet.
      </p>

      <div className="mt-8 grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl bg-white/10 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-black">{order.orderNumber}</h2>
                <p className="text-sm text-slate-300">
                  {order.user.name} · {order.shippingCity}/{order.shippingDistrict}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {order.items.map((item) => `${item.productName} x ${item.quantity}`).join(", ")}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="font-black">{formatPrice(order.grandTotal.toString())}</p>
                <p className="text-sm text-slate-300">
                  {order.status} · {order.paymentMethod}
                </p>
                <p className="text-sm text-slate-400">
                  Odeme: {order.payment?.status ?? "Kayit yok"}
                </p>
              </div>
            </div>

            <form action={updateOrderStatusAction} className="mt-5 grid gap-4">
              <input type="hidden" name="orderId" value={order.id} />

              <div className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <textarea
                  name="adminNote"
                  defaultValue={order.adminNote ?? ""}
                  placeholder="Admin notu"
                  className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
                />

                <Button className="h-11">Durumu guncelle</Button>
              </div>
            </form>
          </article>
        ))}

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white/10 p-6 text-slate-300">Henuz siparis yok.</div>
        ) : null}
      </div>
    </div>
  );
}
