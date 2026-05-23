import Link from "next/link";
import {
  AdminKpiStrip,
  AdminListItem,
  AdminPageHeader,
  AdminPanel
} from "@/components/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

function getSince24HoursDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export default async function AdminDashboardPage() {
  const since24h = getSince24HoursDate();
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
      include: { brand: true, category: true }
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.order.findMany({
      include: { user: true, payment: true, items: true },
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

  const kpis = [
    {
      label: "Net Ciro",
      value: formatPrice(revenue._sum.grandTotal?.toString() ?? 0),
      hint: "Tamamlanan operasyonlardan toplanan gelir",
      tone: "good" as const
    },
    {
      label: "Toplam Siparis",
      value: totalOrders,
      hint: `${pendingOrders} siparis aktif takipte`
    },
    {
      label: "Katalog",
      value: productCount,
      hint: `${lowStockProducts.length} urun kritik stokta`,
      tone: lowStockProducts.length > 0 ? ("warn" as const) : ("default" as const)
    },
    {
      label: "Musteri Havuzu",
      value: customerCount,
      hint: "Kayitli kullanici tabani"
    },
    {
      label: "24s Audit",
      value: auditEvents24h,
      hint: "Yonetim hareketleri"
    },
    {
      label: "24s Bloklanan",
      value: blockedAttempts24h._sum.blockedCount ?? 0,
      hint: "Rate limit ile durdurulan denemeler",
      tone:
        (blockedAttempts24h._sum.blockedCount ?? 0) > 0 ? ("warn" as const) : ("default" as const)
    }
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin control center"
        title="Her gun acilip kullanilacak bir operasyon paneli"
        description="Siparis akisi, stok riski, audit sinyalleri ve musteri yogunlugunu tek bakista okuyup admin ekibini daha hizli karar veren bir ritme tasiyoruz."
        actions={
          <>
            <Link
              href="/admin/orders"
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              Siparislere git
            </Link>
            <Link
              href="/admin/products"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Katalogu yonet
            </Link>
          </>
        }
      />

      <AdminKpiStrip items={kpis} />

      <div className="grid gap-6 2xl:grid-cols-[1.15fr_.85fr]">
        <AdminPanel
          title="Canli siparis akisi"
          description="Son siparisleri, odeme durumunu ve sepet yogunlugunu kaybolmadan takip et."
          actions={
            <Link href="/admin/orders" className="text-sm font-bold text-emerald-200 transition hover:text-emerald-100">
              Tum siparisler
            </Link>
          }
        >
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <AdminListItem key={order.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-white">{order.orderNumber}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-300">
                        {order.status}
                      </span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-100">
                        {order.payment?.status ?? "WAITING"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{order.user.name}</p>
                    <p className="text-sm text-slate-400">
                      {order.items.length} kalem · {order.shippingCity}/{order.shippingDistrict}
                    </p>
                  </div>
                  <div className="space-y-2 text-left lg:text-right">
                    <p className="text-2xl font-black text-white">
                      {formatPrice(order.grandTotal.toString())}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Intl.DateTimeFormat("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(order.createdAt)}
                    </p>
                  </div>
                </div>
              </AdminListItem>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Stok riski"
          description="Siparis akisini bozmadan once hangi SKU'larin mudahale bekledigini goster."
          actions={
            <Link href="/admin/products" className="text-sm font-bold text-emerald-200 transition hover:text-emerald-100">
              Urunlere git
            </Link>
          }
        >
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <AdminListItem key={product.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-black text-white">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {product.brand?.name ?? "Markasiz"} · {product.category.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">SKU {product.sku}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-right">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber-200">
                        Kalan stok
                      </p>
                      <p className="mt-2 text-2xl font-black text-amber-100">{product.stock}</p>
                    </div>
                  </div>
                </AdminListItem>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                Kritik stokta aktif urun yok.
              </div>
            )}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <AdminPanel
          title="Hizli yonlendirmeler"
          description="Sik acilan operasyon alanlarini bir tikla ac."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                href: "/admin/customers",
                title: "Musteri paneli",
                body: "Musteri detaylari, siparis sayisi ve davranis sinyalleri"
              },
              {
                href: "/admin/inventory",
                title: "Envanter kayitlari",
                body: "Stok hareketi, notlar ve iade kaynakli geri yuklemeler"
              },
              {
                href: "/admin/reviews",
                title: "Yorum moderasyonu",
                body: "Yayin onayi, reddetme ve marka itibarini koruyan akis"
              },
              {
                href: "/admin/settings",
                title: "Site ayarlari",
                body: "Checkout, iletisim ve vitrini etkileyen temel bilgiler"
              }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4 transition hover:border-emerald-400/30 hover:bg-slate-950/70"
              >
                <p className="text-base font-black text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Son audit hareketleri"
          description="Ayar, siparis, kupon ve odeme mutasyonlarini yonetici gozunden izle."
          actions={
            <Link href="/admin/audit" className="text-sm font-bold text-emerald-200 transition hover:text-emerald-100">
              Audit ekrani
            </Link>
          }
        >
          <div className="space-y-3">
            {recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log) => (
                <AdminListItem key={log.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-emerald-200/80">
                        {log.action} · {log.entityType}
                      </p>
                      <p className="mt-3 text-base font-black text-white">{log.summary}</p>
                      <p className="mt-2 text-sm text-slate-300">{log.adminUser.name}</p>
                    </div>
                    <p className="text-sm text-slate-400">
                      {new Intl.DateTimeFormat("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(log.createdAt)}
                    </p>
                  </div>
                </AdminListItem>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                Son 24 saatte audit hareketi yok.
              </div>
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
