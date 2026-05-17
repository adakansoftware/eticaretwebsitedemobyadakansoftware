import Link from "next/link";
import { Header } from "@/components/storefront/header";

type LegalSection = {
  title: string;
  body: string;
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  sections,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <Link href="/" className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-900">
            Ana sayfaya don
          </Link>
          <p className="mt-5 text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>

          <div className="mt-6 rounded-[1.8rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
            Bu metin ornektir; canli kullanim oncesi hukuk danismani tarafindan duzenlenmelidir.
          </div>

          {children ? <div className="mt-8">{children}</div> : null}

          <div className="mt-8 grid gap-4">
            {sections.map((section) => (
              <article key={section.title} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
