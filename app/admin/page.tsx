import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [orders, products, users, revenue] = await Promise.all([
    prisma.order.count(), prisma.product.count(), prisma.user.count(), prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } })
  ]);
  const cards = [{ title: "Sipariş", value: orders }, { title: "Ürün", value: products }, { title: "Müşteri", value: users }, { title: "Onaylı ciro", value: formatPrice(revenue._sum.grandTotal?.toString() ?? 0) }];
  return <div><h1 className="text-3xl font-black">Dashboard</h1><div className="mt-8 grid gap-4 md:grid-cols-4">{cards.map((c) => <Card key={c.title} className="border-white/10 bg-white/10 text-white"><CardHeader><CardTitle>{c.title}</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{c.value}</p></CardContent></Card>)}</div><div className="mt-8 rounded-3xl bg-white/10 p-6"><h2 className="font-bold">Güvenlik prensibi</h2><p className="mt-2 text-slate-300">Admin sayfası middleware + server-side requireAdmin ile korunur. Ürün fiyatı, stok ve sipariş toplamı clienttan alınmaz.</p></div></div>;
}
