import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

async function getSince24HoursDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export default async function AdminDashboardPage() {
  const since24h = await getSince24HoursDate();
  const [
    revenue,
    totalOrders,
    pendingOrders,
    productCount,
    lowStockProducts,
    customerCount,
    recentOrders,
    auditEvents24h,
    blockedAttempts24h,
    recentAuditLogs
  ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } }
      }),
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: ["PENDING", "WAITING_PAYMENT", "PAID", "PREPARING"] } }
      }),
      prisma.product.count(),
      prisma.product.findMany({
        where: {
          isActive: true,
          stock: { lte: 5 }
        },
        orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
        take: 6,
        include: { brand: true }
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.findMany({
        include: { user: true, payment: true },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.adminAuditLog.count({
        where: { createdAt: { gte: since24h } }
      }),
      prisma.actionRateLimit.aggregate({
        _sum: { blockedCount: true },
        where: {
          OR: [{ lastBlockedAt: { gte: since24h } }, { updatedAt: { gte: since24h } }]
        }
      }),
      prisma.adminAuditLog.findMany({
        include: {
          adminUser: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

  const cards = [
    { title: "Toplam ciro", value: formatPrice(revenue._sum.grandTotal?.toString() ?? 0) },
    { title: "Toplam siparis", value: totalOrders },
    { title: "Bekleyen siparis", value: pendingOrders },
    { title: "Urun sayisi", value: productCount },
    { title: "Dusuk stok", value: lowStockProducts.length },
    { title: "Musteri sayisi", value: customerCount },
    { title: "24s audit olayi", value: auditEvents24h },
    { title: "24s engellenen deneme", value: blockedAttempts24h._sum.blockedCount ?? 0 }
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-emerald-200/75">
          Operations cockpit
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Ticari cekirdegi panelden takip et
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Siparis, stok, odeme ve musteri gorunurlugunu tek operasyonda toplayan
              daha ciddi bir yonetim yuzeyi.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Siparislere git
            </Link>
            <Link
              href="/admin/products"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/5"
            >
              Katalogu yonet
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="border-white/10 bg-white/5 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Son siparisler</h2>
              <p className="mt-2 text-sm text-slate-300">
                Manuel odeme ve siparis durum akislarini hizli kontrol et.
              </p>
            </div>
            <Link href="/admin/orders" className="text-sm font-bold text-emerald-200">
              Tumunu gor
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-white">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {order.user.name} · {order.status} · {order.payment?.status ?? "WAITING"}
                    </p>
                  </div>
                  <p className="text-lg font-black text-emerald-200">
                    {formatPrice(order.grandTotal.toString())}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Dusuk stok takibi</h2>
              <p className="mt-2 text-sm text-slate-300">
                Siparis akisini etkilemeden once riskli urunleri guncelle.
              </p>
            </div>
            <Link href="/admin/products" className="text-sm font-bold text-emerald-200">
              Urunler
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="font-black text-white">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {product.brand?.name ?? "Markasiz"} · SKU {product.sku}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Kalan stok</span>
                    <span className="font-bold text-amber-300">{product.stock}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/15 p-4 text-sm text-slate-300">
                Kritik stokta aktif urun yok.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Son audit hareketleri</h2>
            <p className="mt-2 text-sm text-slate-300">
              Ayar, siparis, kupon ve operasyon mutasyonlarini buradan hizli izle.
            </p>
          </div>
          <Link href="/admin/audit" className="text-sm font-bold text-emerald-200">
            Audit ekrani
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {recentAuditLogs.length > 0 ? (
            recentAuditLogs.map((log) => (
              <article
                key={log.id}
                className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200/80">
                      {log.action} · {log.entityType}
                    </p>
                    <p className="mt-2 font-black text-white">{log.summary}</p>
                    <p className="mt-1 text-sm text-slate-300">{log.adminUser.name}</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(log.createdAt)}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-white/15 p-4 text-sm text-slate-300">
              Son 24 saatte audit hareketi yok.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
