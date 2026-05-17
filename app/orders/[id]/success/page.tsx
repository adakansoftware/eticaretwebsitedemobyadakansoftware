import { Header } from "@/components/storefront/header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export default async function OrderSuccessPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const order = await prisma.order.findFirst({ where: { id: params.id, userId: user.id }, include: { items: true, payment: true } });
  return <><Header /><main className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-black">Sipariş alındı</h1>{order ? <><p className="mt-3 text-slate-600">Sipariş no: <b>{order.orderNumber}</b></p><p className="mt-2">Toplam: <b>{formatPrice(order.grandTotal.toString())}</b></p><p className="mt-2">Durum: <b>{order.status}</b></p></> : <p>Sipariş bulunamadı.</p>}<Link href="/" className="mt-6 inline-block font-bold">Mağazaya dön</Link></div></main></>;
}
