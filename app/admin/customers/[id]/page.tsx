import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type AdminCustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: AdminCustomerDetailPageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
      },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true, payment: true }
      },
      wishlistItems: {
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              stock: true,
              isActive: true
            }
          }
        }
      },
      _count: { select: { orders: true, addresses: true, wishlistItems: true } }
    }
  });

  if (!user) notFound();

  const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-emerald-200/75">
              Customer detail
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white">{user.name}</h1>
            <p className="mt-3 text-sm text-slate-300">
              {user.email} · {user.phone ?? "Telefon yok"} · {user.role}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Link href="/admin/customers">Müşteri listesine dön</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/orders">Siparişleri aç</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sipariş sayısı" value={user._count.orders} />
        <MetricCard label="Toplam harcama" value={formatPrice(totalSpent)} />
        <MetricCard label="Adres sayısı" value={user._count.addresses} />
        <MetricCard label="Wishlist ürünü" value={user._count.wishlistItems} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Sipariş geçmişi</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Müşterinin son siparişleri, ödeme durumu ve sipariş toplamları.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {user.orders.length > 0 ? (
                user.orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-black text-white">{order.orderNumber}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {order.status} · {order.payment?.status ?? "WAITING"} · {order.items.length} kalem
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {new Intl.DateTimeFormat("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="text-lg font-black text-emerald-200">
                          {formatPrice(order.grandTotal.toString())}
                        </p>
                        <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                          <Link href={`/admin/orders/${order.id}`}>Detay</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/15 p-4 text-sm text-slate-300">
                  Bu müşteri için henüz sipariş yok.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black text-white">Adresler</h2>
            <div className="mt-6 space-y-4">
              {user.addresses.length > 0 ? (
                user.addresses.map((address) => (
                  <article
                    key={address.id}
                    className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-white">
                          {address.title}
                          {address.isDefault ? " · Varsayılan" : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">{address.fullName}</p>
                        <p className="text-sm text-slate-400">{address.phone}</p>
                        <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
                          {address.address}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {address.city} / {address.district}
                          {address.postalCode ? ` · ${address.postalCode}` : ""}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/15 p-4 text-sm text-slate-300">
                  Kayıtlı adres yok.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Wishlist</h2>
          <p className="mt-2 text-sm text-slate-300">
            Müşterinin takip ettiği ürünleri ve stok durumunu buradan görebilirsin.
          </p>

          <div className="mt-6 space-y-4">
            {user.wishlistItems.length > 0 ? (
              user.wishlistItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="font-black text-white">{item.product.name}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {item.product.isActive ? "Aktif ürün" : "Pasif ürün"} · Stok {item.product.stock}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(item.createdAt)}
                    </p>
                    <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                      <Link href={`/products/${item.product.slug}`}>Storefront</Link>
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/15 p-4 text-sm text-slate-300">
                Wishlist listesinde ürün yok.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}
