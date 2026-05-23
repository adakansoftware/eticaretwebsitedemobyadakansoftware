import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PAGE_SIZE, getPageValue, getPagination, getPaginationMeta } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type AdminCustomersPageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    page?: string;
  }>;
};

function buildCustomerLink(q?: string, role?: string, page?: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.trim();
  const role = resolvedSearchParams?.role?.trim();
  const page = getPageValue(resolvedSearchParams?.page, 1);
  const roleFilter: "ADMIN" | "USER" | undefined =
    role === "ADMIN" || role === "USER" ? role : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter } : {}),
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

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true, addresses: true, wishlistItems: true } }
      },
      orderBy: { createdAt: "desc" },
      ...getPagination(page, DEFAULT_PAGE_SIZE)
    })
  ]);

  const pagination = getPaginationMeta(totalItems, page, DEFAULT_PAGE_SIZE);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Müşteriler</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          Hesap durumu, sipariş geçmişi, adres yoğunluğu ve wishlist verisini tek panelden izle.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Ad, e-posta veya telefon ara"
            className="border-white/10 bg-slate-950 text-white ring-white/10"
          />
          <select
            name="role"
            defaultValue={role ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Tüm roller</option>
            <option value="USER">Müşteri</option>
            <option value="ADMIN">Admin</option>
          </select>
          <Button className="w-full lg:w-auto">Filtrele</Button>
        </form>
      </section>

      <section className="grid gap-4">
        {users.length > 0 ? (
          users.map((user) => (
            <article key={user.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xl font-black text-white">{user.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{user.email}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      Rol: {user.role}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      Adres: {user._count.addresses}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      Wishlist: {user._count.wishlistItems}
                    </span>
                  </div>
                </div>

                <div className="flex min-w-[240px] flex-col gap-3">
                  <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sipariş sayısı</span>
                      <span className="font-bold text-white">{user._count.orders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Kayıt tarihi</span>
                      <span className="font-bold text-white">
                        {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(user.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Telefon</span>
                      <span className="font-bold text-white">{user.phone ?? "Yok"}</span>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/admin/customers/${user.id}`}>Detayı aç</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Filtreye uyan müşteri bulunamadı.
          </div>
        )}
      </section>

      {pagination.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <Link
            href={buildCustomerLink(q, role, pagination.hasPreviousPage ? page - 1 : page)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasPreviousPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Önceki
          </Link>
          <p className="text-sm text-slate-300">
            Sayfa {pagination.page} / {pagination.totalPages}
          </p>
          <Link
            href={buildCustomerLink(q, role, pagination.hasNextPage ? page + 1 : page)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${pagination.hasNextPage ? "bg-white text-slate-950" : "pointer-events-none bg-white/10 text-slate-500"}`}
          >
            Sonraki
          </Link>
        </section>
      ) : null}
    </div>
  );
}
