import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  AdminFilterBar,
  AdminKpiStrip,
  AdminListItem,
  AdminPageHeader,
  AdminPanel
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PAGE_SIZE, getPageValue, getPagination, getPaginationMeta } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type AdminCustomersPageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
};

function buildCustomerLink(q?: string, role?: string, dateFrom?: string, dateTo?: string, page?: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

const inputClass =
  "border-white/10 bg-slate-950/80 text-white placeholder:text-slate-500 ring-white/10";
const selectClass =
  "h-11 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition focus:ring-4 focus:ring-white/10";

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const role = resolvedSearchParams?.role?.trim();
  const dateFrom = resolvedSearchParams?.dateFrom?.trim();
  const dateTo = resolvedSearchParams?.dateTo?.trim();
  const page = getPageValue(resolvedSearchParams?.page, 1);
  const roleFilter: "ADMIN" | "USER" | undefined =
    role === "ADMIN" || role === "USER" ? role : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter } : {}),
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
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [totalItems, users, totalCustomers, adminCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true, addresses: true, wishlistItems: true } }
      },
      orderBy: { createdAt: "desc" },
      ...getPagination(page, DEFAULT_PAGE_SIZE)
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "ADMIN" } })
  ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);
  const exportHref = `/admin/customers/export?${new URLSearchParams(
    Object.entries({ q, role: roleFilter, dateFrom, dateTo }).filter(([, value]) => value) as Array<
      [string, string]
    >
  ).toString()}`;

  const kpis = [
    {
      label: "Toplam Musteri",
      value: totalCustomers,
      hint: "Sistemdeki kullanici tabani"
    },
    {
      label: "Admin Hesap",
      value: adminCount,
      hint: "Panel erisimi olan hesaplar"
    },
    {
      label: "Filtre Sonucu",
      value: totalItems,
      hint: "Su anki sorgu sonucu"
    },
    {
      label: "Bu Sayfa",
      value: users.length,
      hint: `Sayfa ${pagination.page} / ${pagination.totalPages}`
    }
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Customer intelligence"
        title="Musteri ekranini destek masasi degil operasyon hafizasi haline getir"
        description="Kayit tarihi, siparis yogunlugu, adres sayisi ve wishlist davranisini daha taranabilir bir panelde topluyoruz."
        actions={
          <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Link href={exportHref}>CSV disa aktar</Link>
          </Button>
        }
      />

      <AdminKpiStrip items={kpis} />

      <AdminPanel
        title="Filtreler"
        description="Ad, e-posta, telefon ve tarih araligi ile musteri havuzunu hizla daralt."
      >
        <AdminFilterBar>
          <form className="grid gap-4 lg:grid-cols-[1.1fr_220px_180px_180px_auto]">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Ad, e-posta veya telefon ara"
              className={inputClass}
            />
            <select name="role" defaultValue={role ?? ""} className={selectClass}>
              <option value="">Tum roller</option>
              <option value="USER">Musteri</option>
              <option value="ADMIN">Admin</option>
            </select>
            <Input name="dateFrom" type="date" defaultValue={dateFrom} className={inputClass} />
            <Input name="dateTo" type="date" defaultValue={dateTo} className={inputClass} />
            <Button className="w-full bg-white text-slate-950 hover:bg-slate-200 lg:w-auto">
              Filtrele
            </Button>
          </form>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel
        title="Musteri listesi"
        description="Yogun kullanimda bile tek bakista karar verebilmek icin kartlari daha net veri bloklariyla duzenledik."
      >
        <div className="space-y-4">
          {users.length > 0 ? (
            users.map((user) => (
              <AdminListItem key={user.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-black text-white">{user.name}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-300">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{user.email}</p>
                    <p className="text-sm text-slate-400">{user.phone ?? "Telefon bilgisi yok"}</p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                        Siparis {user._count.orders}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                        Adres {user._count.addresses}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                        Wishlist {user._count.wishlistItems}
                      </span>
                    </div>
                  </div>

                  <div className="grid min-w-[280px] gap-3 rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Kayit tarihi</span>
                      <span className="font-bold text-white">
                        {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(user.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sonraki adim</span>
                      <span className="font-bold text-white">
                        {user._count.orders > 0 ? "Siparis gecmisi var" : "Ilk siparis bekliyor"}
                      </span>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Link href={`/admin/customers/${user.id}`}>Detayi ac</Link>
                    </Button>
                  </div>
                </div>
              </AdminListItem>
            ))
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-white/15 px-5 py-8 text-sm text-slate-300">
              Filtreye uyan musteri bulunamadi.
            </div>
          )}
        </div>
      </AdminPanel>

      {pagination.totalPages > 1 ? (
        <AdminPanel>
          <div className="flex items-center justify-between gap-4">
            <Link
              href={buildCustomerLink(q, role, dateFrom, dateTo, pagination.hasPreviousPage ? page - 1 : page)}
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
              href={buildCustomerLink(q, role, dateFrom, dateTo, pagination.hasNextPage ? page + 1 : page)}
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
