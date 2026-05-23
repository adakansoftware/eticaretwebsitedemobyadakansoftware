import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage() {
  const logs = await prisma.adminAuditLog.findMany({
    include: {
      adminUser: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Audit log</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
          Admin islemlerinin baslangic seviyesi kayitlari burada tutulur. Bu ekran operasyon
          gecmisini geriye donuk izlemek icin kullanilir.
        </p>
      </section>

      <section className="grid gap-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <article key={log.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200/80">
                    {log.action} · {log.entityType}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">{log.summary}</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {log.adminUser.name} · {log.adminUser.email}
                  </p>
                  {log.entityId ? (
                    <p className="mt-1 text-sm text-slate-400">Entity ID: {log.entityId}</p>
                  ) : null}
                  {log.metadata ? (
                    <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : null}
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
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-slate-300">
            Henuz audit kaydi yok.
          </div>
        )}
      </section>
    </div>
  );
}
