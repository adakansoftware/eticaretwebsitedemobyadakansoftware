"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12">
      <section className="w-full rounded-[2.6rem] border border-slate-200 bg-white/90 p-8 shadow-[0_26px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.34em] text-amber-700">
            Uygulama hatasi
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Bu ekranda beklenmeyen bir sorun olustu.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Akis tamamen bozulmadan seni geri topluyoruz. Bir kez daha denemek genelde yeterli
            olur; sorun devam ederse teknik kayitlarla birlikte inceleyebiliriz.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            Ana sayfaya don
          </Link>
        </div>

        <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          Referans kodu: {error.digest ?? "log-yok"}
        </div>
      </section>
    </main>
  );
}
