import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({ include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } });
  return <div><h1 className="text-3xl font-black">Müşteriler</h1><div className="mt-8 grid gap-3">{users.map((u) => <div key={u.id} className="rounded-2xl bg-white/10 p-5"><b>{u.name}</b><p className="text-sm text-slate-300">{u.email} · {u.role} · {u._count.orders} sipariş</p></div>)}</div></div>;
}
