import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ include: { user: true, items: true, payment: true }, orderBy: { createdAt: "desc" } });
  return <div><h1 className="text-3xl font-black">Siparişler</h1><div className="mt-8 grid gap-4">{orders.map((o) => <article key={o.id} className="rounded-2xl bg-white/10 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-black">{o.orderNumber}</h2><p className="text-sm text-slate-300">{o.user.name} · {o.shippingCity}/{o.shippingDistrict}</p></div><div className="text-right"><p className="font-black">{formatPrice(o.grandTotal.toString())}</p><p className="text-sm text-slate-300">{o.status} · {o.paymentMethod}</p></div></div><div className="mt-4 text-sm text-slate-300">{o.items.map((i) => `${i.productName} x ${i.quantity}`).join(", ")}</div></article>)}</div></div>;
}
