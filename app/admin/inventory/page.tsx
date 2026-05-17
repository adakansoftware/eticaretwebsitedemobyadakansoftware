import Link from "next/link";
import { DEFAULT_PAGE_SIZE, getPagination, getPaginationMeta, getPageValue } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const reasonOptions = ["SEED", "ADMIN_ADJUSTMENT", "ORDER_CREATED", "ORDER_CANCELLED", "RETURNED"] as const;

type InventoryPageProps = {
  searchParams?: Promise<{ q?: string; reason?: string; page?: string }>;
};

function buildInventoryLink(q?: string, reason?: string, page?: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (reason) params.set("reason", reason);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/inventory?${query}` : "/admin/inventory";
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const reason = resolvedSearchParams?.reason?.trim();
  const page = getPageValue(resolvedSearchParams?.page, 1);

  const where = {
    ...(reason ? { reason: reason as (typeof reasonOptions)[number] } : {}),
    ...(q
      ? {
          product: {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } }
            ]
          }
        }
      : {})
  };

  const [totalItems, logs] = await Promise.all([
    prisma.inventoryLog.count({ where }),
    prisma.inventoryLog.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: "desc" },
      ...getPagination(page, DEFAULT_PAGE_SIZE)
    })
  ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Envanter loglari</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Stok hareketlerini urun, SKU ve sebep bazinda takip et. Mevcut veri modelinde dogrudan
          order relation tutulmadigi icin ilgili akisi not alanindan gorursun.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Urun adi veya SKU ara"
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none"
          />
          <select
            name="reason"
            defaultValue={reason ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tum sebepler</option>
            {reasonOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950">
            Filtrele
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <article key={log.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{log.product.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    SKU {log.product.sku} · {log.reason}
                  </p>
                  {log.note ? <p className="mt-2 text-sm text-slate-400">{log.note}</p> : null}
                </div>
                <div className="text-left xl:text-right">
                  <p className={`text-xl font-black ${log.change >= 0 ? "text-emerald-300" : "text-amber-300"}`}>
                    {log.change >= 0 ? `+${log.change}` : log.change}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">Son stok: {log.stockAfter ?? "-"}</p>
                  <p className="text-sm text-slate-400">
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(log.createdAt)}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Filtreye uyan envanter logu bulunamadi.
          </div>
        )}
      </section>

      {pagination.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <Link
            href={buildInventoryLink(q, reason, pagination.hasPreviousPage ? page - 1 : page)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasPreviousPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Onceki
          </Link>
          <p className="text-sm text-slate-300">
            Sayfa {pagination.page} / {pagination.totalPages}
          </p>
          <Link
            href={buildInventoryLink(q, reason, pagination.hasNextPage ? page + 1 : page)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasNextPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Sonraki
          </Link>
        </section>
      ) : null}
    </div>
  );
}
