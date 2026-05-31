import { Header } from "@/components/storefront/header";

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/4.2] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsLoadingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="rounded-[2.6rem] border border-slate-200 bg-white/80 p-6 shadow-[0_26px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="h-3 w-36 animate-pulse rounded-full bg-amber-100" />
              <div className="h-12 w-64 animate-pulse rounded-[1rem] bg-slate-200" />
              <div className="h-5 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-5 w-4/5 animate-pulse rounded-full bg-slate-100" />
            </div>

            <div className="h-12 w-full animate-pulse rounded-full bg-slate-100 lg:max-w-md" />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
              <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-11 w-full animate-pulse rounded-2xl bg-white" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <div className="h-11 flex-1 animate-pulse rounded-full bg-slate-200" />
                <div className="h-11 flex-1 animate-pulse rounded-full bg-slate-200" />
              </div>
            </aside>

            <div>
              <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-8 w-28 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
