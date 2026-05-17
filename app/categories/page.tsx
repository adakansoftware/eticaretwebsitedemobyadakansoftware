import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "Aktif kategorileri inceleyerek ihtiyacınıza uygun ürünlere hızla ulaşın."
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="rounded-[2.6rem] border border-slate-200 bg-white/85 p-6 shadow-[0_26px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="max-w-3xl">
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Kategoriler
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Aktif kategorileri inceleyerek size uygun ürünlere hızlıca ulaşabilir,
              ilgilendiğiniz ürün grubunu doğrudan açabilirsiniz.
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {category.imageUrl ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <Image
                        src={category.imageUrl}
                        alt={`${category.name} kategorisi`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-end bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50 p-6">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-amber-700">
                        Kategori
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 p-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">
                        {category.name}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {category.description ?? "Bu kategori için seçili ürünleri inceleyin."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
                        {category._count.products} ürün
                      </span>
                      <span className="text-sm font-bold text-emerald-900 transition group-hover:translate-x-1">
                        Kategoriyi aç
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              Henüz aktif kategori bulunmuyor.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
