import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%)] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.25)] md:p-8">
      <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-emerald-200/80">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.12)] backdrop-blur md:p-6",
        className
      )}
    >
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {title ? <h2 className="text-xl font-black text-white">{title}</h2> : null}
            {description ? <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "from-emerald-500/18 to-emerald-400/6"
      : tone === "warn"
        ? "from-amber-500/18 to-amber-400/6"
        : "from-sky-500/14 to-white/0";

  return (
    <article className={cn("relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-950/55 p-5", `bg-gradient-to-br ${toneClass}`)}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
      <p className="relative text-[0.7rem] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="relative mt-4 text-3xl font-black tracking-tight text-white">{value}</p>
      {hint ? <p className="relative mt-3 text-sm text-slate-300">{hint}</p> : null}
    </article>
  );
}

export function AdminKpiStrip({
  items
}: {
  items: Array<{ label: string; value: ReactNode; hint?: string; tone?: "default" | "good" | "warn" }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <AdminStatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-4 shadow-inner shadow-slate-950/20">
      {children}
    </div>
  );
}

export function AdminListItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-[1.4rem] border border-white/10 bg-slate-950/55 p-4 transition hover:border-emerald-400/20 hover:bg-slate-950/70",
        className
      )}
    >
      {children}
    </article>
  );
}
