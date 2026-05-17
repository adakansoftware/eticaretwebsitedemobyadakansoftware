import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { orders: true, addresses: true, wishlistItems: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Musteriler</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          Hesap durumu, siparis gecmisi ve adres yogunlugunu tek bakista gorebilirsin.
        </p>
      </section>

      <section className="grid gap-4">
        {users.map((user) => (
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

              <div className="grid min-w-[220px] gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Siparis sayisi</span>
                  <span className="font-bold text-white">{user._count.orders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kayit tarihi</span>
                  <span className="font-bold text-white">
                    {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(user.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telefon</span>
                  <span className="font-bold text-white">{user.phone ?? "Yok"}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
