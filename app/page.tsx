import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [products, banner] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, include: { images: true }, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.banner.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
  ]);
  return <><Header /><main>
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[1.1fr_.9fr] md:items-center">
      <div><p className="font-bold text-brand-700">Adakan Commerce Core</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Markaya göre özelleştirilen premium e-ticaret çekirdeği.</h1><p className="mt-5 max-w-xl text-lg text-slate-600">Stok, sipariş, manuel ödeme ve admin paneli hazır; küçük ve orta ölçekli işletmeler için temiz temel.</p><div className="mt-8 flex gap-3"><Button asChild size="lg"><Link href="/products">Ürünlere bak</Link></Button><Button asChild variant="outline" size="lg"><Link href="/admin">Admin demo</Link></Button></div></div>
      <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl"><p className="text-sm text-slate-300">{banner?.subtitle ?? "Yeni sezon"}</p><h2 className="mt-3 text-3xl font-black">{banner?.title ?? "Temiz, hızlı, güvenli satış altyapısı"}</h2><p className="mt-4 text-slate-300">Fiyat, stok ve sipariş toplamları server tarafında doğrulanır. Client’a güvenilmez.</p></div>
    </section>
    <section className="mx-auto max-w-7xl px-4 pb-16"><div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-black">Öne çıkan ürünler</h2><Link href="/products" className="text-sm font-bold">Tümünü gör</Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
  </main></>;
}
