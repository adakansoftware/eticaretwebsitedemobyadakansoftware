import { Header } from "@/components/storefront/header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <><Header /><main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-black">Siparişlerim</h1><div className="mt-8 grid gap-4">{orders.map((o) => <div key={o.id} className="rounded-2xl bg-white p-5 shadow-sm"><b>{o.orderNumber}</b><p className="text-sm text-slate-600">{o.status} · {formatPrice(o.grandTotal.toString())}</p></div>)}</div></main></>;
}
