import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import {
  applyCouponFormAction,
  clearCartFormAction,
  removeCartItemFormAction,
  updateCartItemQuantityFormAction
} from "@/lib/actions/cart-actions";
import { calculateCartTotals, getCart } from "@/lib/cart";
import { getEffectiveUnitPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sepet",
  description: "Sepetinizdeki ürünleri kontrol edin, kargo ve ödeme adımına güvenle geçin."
};

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), prisma.siteSettings.findFirst()]);
  const totals = await calculateCartTotals(cart.id, cart.couponCode ?? undefined).catch(() => ({
    subtotal: 0,
    shippingTotal: 0,
    discountTotal: 0,
    grandTotal: 0
  }));

  const freeShippingThreshold = Number(settings?.freeShippingThreshold ?? 0);
  const amountForFreeShipping =
    freeShippingThreshold > 0 ? Math.max(freeShippingThreshold - totals.subtotal, 0) : 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-[0_26px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-amber-700">
                Sepet
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Sepet
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Sepetinizdeki ürünleri kontrol edin, kargo ve ödeme adımına güvenle geçin.
              </p>
            </div>

            {cart.items.length > 0 ? (
              <form action={clearCartFormAction}>
                <Button variant="outline">Sepeti temizle</Button>
              </form>
            ) : null}
          </div>

          {cart.items.length === 0 ? (
            <div className="mt-10 grid gap-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Sepetiniz şu an boş</h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Ürün ekledikten sonra ödeme adımına geçebilirsiniz.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/products">Ürünleri keşfet</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const effectivePrice = getEffectiveUnitPrice(item.product);

                  return (
                    <article
                      key={item.id}
                      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
                            {item.product.brand?.name ?? "Seçili ürün"}
                          </p>
                          <h2 className="text-xl font-black tracking-tight text-slate-950">
                            {item.product.name}
                          </h2>
                          <p className="text-sm leading-6 text-slate-600">
                            {item.product.shortDescription ?? item.product.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                              SKU: {item.product.sku}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                              Stok: {item.product.stock}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-[250px] space-y-4">
                          <div className="text-left md:text-right">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Birim fiyat
                            </p>
                            <p className="mt-1 text-2xl font-black text-slate-950">
                              {formatPrice(effectivePrice)}
                            </p>
                          </div>

                          <form action={updateCartItemQuantityFormAction} className="flex items-center gap-3">
                            <input type="hidden" name="itemId" value={item.id} />
                            <label className="text-sm font-semibold text-slate-700" htmlFor={`qty-${item.id}`}>
                              Adet
                            </label>
                            <input
                              id={`qty-${item.id}`}
                              type="number"
                              name="quantity"
                              min={1}
                              max={Math.max(1, item.product.stock)}
                              defaultValue={item.quantity}
                              className="h-11 w-24 rounded-full border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                            />
                            <Button type="submit" variant="outline">
                              Güncelle
                            </Button>
                          </form>

                          <div className="flex items-center justify-between">
                            <p className="text-lg font-black text-slate-950">
                              {formatPrice(effectivePrice * item.quantity)}
                            </p>
                            <form action={removeCartItemFormAction}>
                              <input type="hidden" name="itemId" value={item.id} />
                              <Button type="submit" variant="ghost">
                                Kaldır
                              </Button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="space-y-4">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-100/75">
                    Sipariş özeti
                  </p>

                  <div className="mt-6 space-y-3 text-sm text-white/80">
                    <div className="flex items-center justify-between">
                      <span>Ara toplam</span>
                      <span>{formatPrice(totals.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>İndirim</span>
                      <span>-{formatPrice(totals.discountTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Kargo</span>
                      <span>{formatPrice(totals.shippingTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-lg font-black text-white">
                      <span>Genel toplam</span>
                      <span>{formatPrice(totals.grandTotal)}</span>
                    </div>
                  </div>

                  <form action={applyCouponFormAction} className="mt-6 space-y-3">
                    <label className="block text-sm font-semibold text-white">Kupon kodu</label>
                    <div className="flex gap-2">
                      <input
                        name="couponCode"
                        defaultValue={cart.couponCode ?? ""}
                        placeholder="ÖRN. HOSGELDIN50"
                        className="h-11 flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                      />
                      <Button type="submit" variant="outline" className="border-white/15 bg-white text-slate-950">
                        Uygula
                      </Button>
                    </div>
                  </form>

                  {cart.couponCode ? (
                    <p className="mt-3 text-sm text-emerald-200">
                      Aktif kupon: <span className="font-bold">{cart.couponCode}</span>
                    </p>
                  ) : null}

                  <Button asChild size="lg" className="mt-6 w-full">
                    <Link href="/checkout">Ödeme adımına geç</Link>
                  </Button>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Kargo notu</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {settings?.checkoutMessage ??
                      "Kargo ve ödeme detaylarınız siparişiniz tamamlanmadan önce son kez kontrol edilir."}
                  </p>
                  {freeShippingThreshold > 0 ? (
                    <p className="mt-4 text-sm font-semibold text-emerald-800">
                      {amountForFreeShipping > 0
                        ? `${formatPrice(amountForFreeShipping)} daha ekleyerek ücretsiz kargo eşiğine ulaşabilirsiniz.`
                        : "Bu sepet ücretsiz kargo eşiğine ulaştı."}
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
