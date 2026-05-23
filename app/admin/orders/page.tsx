import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAdminOrderAction } from "@/lib/actions/admin-order-actions";
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
    ...((dateFrom || dateTo)
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
            { shippingCity: { contains: q, mode: "insensitive" } },
            { shippingDistrict: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [totalItems, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { user: true, items: true, payment: true },
      orderBy: { createdAt: "desc" },
      ...getPagination(page, DEFAULT_PAGE_SIZE)
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

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Siparişler</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Sipariş durumu, ödeme durumu ve iç operasyon notlarını filtreleyerek yönet.
            </p>
          </div>

          <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Link href={exportHref}>CSV dışa aktar</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-4 xl:grid-cols-[1fr_220px_220px_220px_180px_180px_auto]">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Sipariş no, müşteri veya şehir ara"
            className="border-white/10 bg-slate-950 text-white ring-white/10"
          />
          <select
            name="status"
            defaultValue={orderStatusFilter ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm sipariş durumları</option>
            {orderStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="paymentStatus"
            defaultValue={paymentStatusFilter ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm ödeme durumları</option>
            {paymentStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="paymentMethod"
            defaultValue={currentFilters.paymentMethod ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tum odeme yontemleri</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="CASH_ON_DELIVERY">CASH_ON_DELIVERY</option>
          </select>
          <Input
            name="dateFrom"
            type="date"
            defaultValue={dateFrom}
            className="border-white/10 bg-slate-950 text-white ring-white/10"
          />
          <Input
            name="dateTo"
            type="date"
            defaultValue={dateTo}
            className="border-white/10 bg-slate-950 text-white ring-white/10"
          />
          <Button className="w-full xl:w-auto">Filtrele</Button>
        </form>
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
                    Ödeme: {order.payment?.status ?? "Kayıt yok"}
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
                    {orderStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    name="paymentStatus"
                    defaultValue={order.payment?.status ?? "WAITING"}
                    className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
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
                    placeholder="Admin notu"
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
                  />

                  <Button className="h-11">Güncelle</Button>
                  <Button asChild variant="outline" className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/admin/orders/${order.id}`}>Detay</Link>
                  </Button>
                </div>
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Filtreye uyan sipariş bulunamadı.
          </div>
        )}
      </section>

      {pagination.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <Link
            href={buildOrdersLink(currentFilters, {
              page: pagination.hasPreviousPage ? String(page - 1) : String(page)
            })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasPreviousPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Önceki
          </Link>
          <p className="text-sm text-slate-300">
            Sayfa {pagination.page} / {pagination.totalPages}
          </p>
          <Link
            href={buildOrdersLink(currentFilters, {
              page: pagination.hasNextPage ? String(page + 1) : String(page)
            })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasNextPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Sonraki
          </Link>
        </section>
      ) : null}
    </div>
  );
}
