import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import {
  AdminFilterBar,
  AdminKpiStrip,
  AdminListItem,
  AdminPageHeader,
  AdminPanel
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAdminOrderFormAction } from "@/lib/actions/admin-order-actions";
import { DEFAULT_PAGE_SIZE, getPageValue, getPagination, getPaginationMeta } from "@/lib/pagination";
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

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
};

function getOrderCustomerLabel(order: {
  user: { name: string | null; email: string } | null;
  guestName: string | null;
  guestEmail: string | null;
}) {
  if (order.user) {
    return order.user.name ? `${order.user.name} / ${order.user.email}` : order.user.email;
  }

  if (order.guestName && order.guestEmail) {
    return `${order.guestName} / ${order.guestEmail}`;
  }

  return order.guestName ?? order.guestEmail ?? "Misafir siparisi";
}

function buildOrdersLink(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...current, ...updates })) {
    if (value) params.set(key, value);
  }

  if (!updates.page) {
    params.delete("page");
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

const inputClass =
  "border-white/10 bg-slate-950/80 text-white placeholder:text-slate-500 ring-white/10";
const selectClass =
  "h-11 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition focus:ring-4 focus:ring-white/10";

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const status = resolvedSearchParams?.status?.trim();
  const paymentStatus = resolvedSearchParams?.paymentStatus?.trim();
  const paymentMethod = resolvedSearchParams?.paymentMethod?.trim();
  const dateFrom = resolvedSearchParams?.dateFrom?.trim();
  const dateTo = resolvedSearchParams?.dateTo?.trim();
  const page = getPageValue(resolvedSearchParams?.page, 1);

  const orderStatusFilter = orderStatuses.find((item) => item === status);
  const paymentStatusFilter = paymentStatuses.find((item) => item === paymentStatus);

  const where: Prisma.OrderWhereInput = {
    ...(orderStatusFilter ? { status: orderStatusFilter } : {}),
    ...(paymentStatusFilter ? { payment: { is: { status: paymentStatusFilter } } } : {}),
    ...(
      paymentMethod === "BANK_TRANSFER" || paymentMethod === "CASH_ON_DELIVERY"
        ? { paymentMethod }
        : {}
    ),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {})
          }
        }
      : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { guestName: { contains: q, mode: "insensitive" } },
            { guestEmail: { contains: q, mode: "insensitive" } },
            { shippingCity: { contains: q, mode: "insensitive" } },
            { shippingDistrict: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [totalItems, orders, totals] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { user: true, items: true, payment: true },
      orderBy: { createdAt: "desc" },
      ...getPagination(page, DEFAULT_PAGE_SIZE)
    }),
    prisma.order.aggregate({
      where,
      _sum: { grandTotal: true },
      _count: { _all: true }
    })
  ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);
  const currentFilters = {
    q,
    status: orderStatusFilter,
    paymentStatus: paymentStatusFilter,
    paymentMethod:
      paymentMethod === "BANK_TRANSFER" || paymentMethod === "CASH_ON_DELIVERY"
        ? paymentMethod
        : undefined,
    dateFrom,
    dateTo
  };
  const exportHref = `/admin/orders/export?${new URLSearchParams(
    Object.entries(currentFilters).filter(([, value]) => value) as Array<[string, string]>
  ).toString()}`;

  const kpis = [
    {
      label: "Filtrelenen Siparis",
      value: totals._count._all,
      hint: "Ekrandaki sorgu sonucu"
    },
    {
      label: "Toplam Tutar",
      value: formatPrice(totals._sum.grandTotal?.toString() ?? 0),
      hint: "Filtreye uyan ciro toplami",
      tone: "good" as const
    },
    {
      label: "Bu Sayfa",
      value: orders.length,
      hint: `Sayfa ${pagination.page} / ${pagination.totalPages}`
    },
    {
      label: "Aksiyon Hazir",
      value: orders.filter((order) => order.status !== "DELIVERED").length,
      hint: "Teslim edilmemis kayitlar"
    }
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Order desk"
        title="Siparisleri hizli tarayan ve kolay aksiyon alan bir masa"
        description="Filtreleri, durum guncellemelerini ve operasyon notlarini tek ekranda tutup siparis akisini dagitmadan yonet."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={exportHref}>CSV disa aktar</Link>
            </Button>
            <Button asChild className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">
              <Link href="/admin/orders?status=WAITING_PAYMENT">Odeme bekleyenler</Link>
            </Button>
          </>
        }
      />

      <AdminKpiStrip items={kpis} />

      <AdminPanel
        title="Filtreler"
        description="Siparis no, musteri, odeme akisi ve tarih araligiyla yogun gunlerde bile hizli daralt."
      >
        <AdminFilterBar>
          <form className="grid gap-4 xl:grid-cols-[1.1fr_220px_220px_220px_180px_180px_auto]">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Siparis no, musteri veya sehir ara"
              className={inputClass}
            />
            <select name="status" defaultValue={orderStatusFilter ?? ""} className={selectClass}>
              <option value="">Tum siparis durumlari</option>
              {orderStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="paymentStatus"
              defaultValue={paymentStatusFilter ?? ""}
              className={selectClass}
            >
              <option value="">Tum odeme durumlari</option>
              {paymentStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="paymentMethod"
              defaultValue={currentFilters.paymentMethod ?? ""}
              className={selectClass}
            >
              <option value="">Tum odeme yontemleri</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              <option value="CASH_ON_DELIVERY">CASH_ON_DELIVERY</option>
            </select>
            <Input name="dateFrom" type="date" defaultValue={dateFrom} className={inputClass} />
            <Input name="dateTo" type="date" defaultValue={dateTo} className={inputClass} />
            <Button className="w-full bg-white text-slate-950 hover:bg-slate-200 xl:w-auto">
              Filtrele
            </Button>
          </form>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel
        title="Siparis listesi"
        description="Kart yapisini korurken okunurlugu masaustu kontrol paneli seviyesine cekiyoruz."
      >
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <AdminListItem key={order.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-white">{order.orderNumber}</h2>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-300">
                        {order.status}
                      </span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-100">
                        {order.payment?.status ?? "NO_PAYMENT"}
                      </span>
                      {!order.userId ? (
                        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sky-100">
                          Guest
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-300">{getOrderCustomerLabel(order)}</p>
                    <p className="text-sm text-slate-400">
                      {order.shippingCity}/{order.shippingDistrict} / {order.paymentMethod}
                    </p>
                    <p className="text-sm text-slate-400">
                      {order.items.map((item) => `${item.productName} x ${item.quantity}`).join(", ")}
                    </p>
                  </div>

                  <div className="space-y-2 text-left 2xl:min-w-[240px] 2xl:text-right">
                    <p className="text-2xl font-black text-white">
                      {formatPrice(order.grandTotal.toString())}
                    </p>
                    <p className="text-sm text-slate-300">
                      {new Intl.DateTimeFormat("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(order.createdAt)}
                    </p>
                    <p className="text-sm text-slate-400">
                      Admin notu: {order.adminNote?.trim() || "Henuz not eklenmedi"}
                    </p>
                  </div>
                </div>

                <AdminActionForm action={updateAdminOrderFormAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="orderId" value={order.id} />

                  <div className="grid gap-4 xl:grid-cols-[220px_220px_1fr_auto_auto] xl:items-start">
                    <select name="status" defaultValue={order.status} className={selectClass}>
                      {orderStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <select
                      name="paymentStatus"
                      defaultValue={order.payment?.status ?? "WAITING"}
                      className={selectClass}
                    >
                      {paymentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <textarea
                      name="adminNote"
                      defaultValue={order.adminNote ?? ""}
                      placeholder="Operasyon notu, musteri bilgilendirme ozeti veya kargo hatirlatmasi"
                      className="min-h-24 w-full rounded-[1.4rem] border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none transition focus:ring-4 focus:ring-white/10"
                    />

                    <AdminSubmitButton
                      className="h-11 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                      idleLabel="Guncelle"
                      pendingLabel="Kaydediliyor..."
                    />
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Link href={`/admin/orders/${order.id}`}>Detay</Link>
                    </Button>
                  </div>
                </AdminActionForm>
              </AdminListItem>
            ))
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-white/15 px-5 py-8 text-sm text-slate-300">
              Filtreye uyan siparis bulunamadi.
            </div>
          )}
        </div>
      </AdminPanel>

      {pagination.totalPages > 1 ? (
        <AdminPanel>
          <div className="flex items-center justify-between gap-4">
            <Link
              href={buildOrdersLink(currentFilters, {
                page: pagination.hasPreviousPage ? String(page - 1) : String(page)
              })}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                pagination.hasPreviousPage
                  ? "bg-white text-slate-950"
                  : "pointer-events-none bg-white/10 text-slate-500"
              }`}
            >
              Onceki
            </Link>
            <p className="text-sm text-slate-300">
              Sayfa {pagination.page} / {pagination.totalPages}
            </p>
            <Link
              href={buildOrdersLink(currentFilters, {
                page: pagination.hasNextPage ? String(page + 1) : String(page)
              })}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                pagination.hasNextPage
                  ? "bg-white text-slate-950"
                  : "pointer-events-none bg-white/10 text-slate-500"
              }`}
            >
              Sonraki
            </Link>
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}
