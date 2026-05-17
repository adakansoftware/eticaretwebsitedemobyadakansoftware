import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { removeWishlistItemAction } from "@/lib/actions/wishlist-actions";
import { getEffectiveUnitPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-8 text-center shadow-sm">
            <h1 className="text-3xl font-black text-slate-950">Favorilerim</h1>
            <p className="mt-3 text-slate-600">
              Favori listeni gorebilmek ve urunleri sonra incelemek icin giris yapmalisin.
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">Giris yap</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          brand: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Favorilerim</h1>
            <p className="mt-2 text-slate-600">
              Daha sonra karar vermek istedigin urunleri burada toplu gorursun.
            </p>
          </div>
          <Link href="/products" className="font-bold text-slate-700 underline">
            Kataloga don
          </Link>
        </div>

        <section className="mt-8 grid gap-4">
          {wishlistItems.length > 0 ? (
            wishlistItems.map((item) => (
              <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[120px_1fr_auto] md:items-start">
                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-slate-100">
                    {item.product.images[0]?.url ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
                      {item.product.brand?.name ?? "Adakan selection"}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{item.product.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.product.shortDescription ?? item.product.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        {formatPrice(getEffectiveUnitPrice(item.product))}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                        {item.product.stock > 0 ? `${item.product.stock} stok` : "Stokta yok"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    <Button asChild variant="outline">
                      <Link href={`/products/${item.product.slug}`}>Urunu gor</Link>
                    </Button>
                    <form action={async () => {
                      "use server";
                      await removeWishlistItemAction(item.id, item.product.slug);
                    }}>
                      <Button variant="ghost">Favorilerden kaldir</Button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              Henuz favori urunun yok. Begendigin urunleri kaydedip sonra buradan karsilastirabilirsin.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
