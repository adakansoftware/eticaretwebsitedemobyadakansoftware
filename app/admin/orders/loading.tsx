function AdminOrderCardSkeleton() {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="h-7 w-28 animate-pulse rounded-full bg-emerald-400/10" />
          </div>
          <div className="h-4 w-56 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-44 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-72 animate-pulse rounded-full bg-white/5" />
        </div>

        <div className="space-y-2 2xl:min-w-[240px]">
          <div className="ml-auto h-8 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="ml-auto h-4 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="ml-auto h-4 w-48 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[220px_220px_1fr_auto_auto] xl:items-start">
        <div className="h-11 animate-pulse rounded-2xl bg-slate-950/80" />
        <div className="h-11 animate-pulse rounded-2xl bg-slate-950/80" />
        <div className="min-h-24 animate-pulse rounded-[1.4rem] bg-slate-950/80" />
        <div className="h-11 animate-pulse rounded-full bg-emerald-400/30" />
        <div className="h-11 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export default function AdminOrdersLoadingPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.88))] p-7 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-12 w-3/4 animate-pulse rounded-[1rem] bg-white/10" />
          <div className="h-5 w-full animate-pulse rounded-full bg-white/5" />
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/5" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="h-11 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-11 w-44 animate-pulse rounded-full bg-emerald-400/20" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.18)]"
          >
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-36 animate-pulse rounded-full bg-white/5" />
          </div>
        ))}
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.18)]">
        <div className="space-y-3">
          <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-80 animate-pulse rounded-full bg-white/5" />
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_220px_220px_220px_180px_180px_auto]">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-2xl bg-slate-950/80" />
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.18)]">
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-96 animate-pulse rounded-full bg-white/5" />
        </div>
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <AdminOrderCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
