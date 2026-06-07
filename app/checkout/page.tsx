import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { calculateCartTotals, getCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/utils";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const [addresses, cart, settings] = await Promise.all([
    user
      ? prisma.address.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
        })
      : Promise.resolve([]),
    getCart(),
    getSiteSettings()
  ]);

  const totals = await calculateCartTotals(cart.id, cart.couponCode ?? undefined).catch(() => ({
    subtotal: 0,
    shippingTotal: 0,
    discountTotal: 0,
    grandTotal: 0
  }));

  const hasSavedAddresses = user ? addresses.length > 0 : true;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-[0_26px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-amber-700">
              Checkout discipline
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Checkout
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Siparis, stok ve toplamlar veritabani uzerinden son kez dogrulanir. Kayitli
              kullanicilar adres secerek, misafirler ise teslimat bilgilerini dogrudan yazarak
              siparis olusturabilir.
            </p>
          </div>

          {user && addresses.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <p className="font-bold">Checkout icin once teslimat adresi eklenmeli.</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                Adres kaydi olmadan siparis snapshot verisi olusturulmaz.
              </p>
              <Link href="/account/addresses" className="mt-4 inline-flex font-bold underline">
                Adreslerimi yonet
              </Link>
            </div>
          ) : null}

          {!user ? (
            <div className="mt-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
              <p className="font-bold">Misafir checkout aktif</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                Hesap acmadan siparis verebilirsin. Siparis ozeti ve sonraki bilgilendirmeler
                girdigin e-posta adresine gonderilir.
              </p>
              <Link href="/login" className="mt-4 inline-flex font-bold underline">
                Hesabim var, giris yapmak istiyorum
              </Link>
            </div>
          ) : null}

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <form action="/api/checkout" method="post" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <input type="hidden" name="guestMode" value={user ? "false" : "true"} />

              <div className="grid gap-6">
                {user ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-900">Teslimat adresi</label>
                    <select
                      name="addressId"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                      disabled={addresses.length === 0}
                    >
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.title} - {address.city}/{address.district}
                          {address.isDefault ? " (Varsayilan)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-900">Ad soyad</label>
                      <input
                        name="guestName"
                        defaultValue=""
                        placeholder="Teslim alacak kisi"
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-900">E-posta</label>
                      <input
                        name="guestEmail"
                        type="email"
                        placeholder="E-posta adresi"
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-900">Telefon</label>
                      <input
                        name="guestPhone"
                        placeholder="Telefon numarasi"
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-900">Sehir</label>
                      <input
                        name="guestCity"
                        placeholder="Sehir"
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-900">Ilce</label>
                      <input
                        name="guestDistrict"
                        placeholder="Ilce"
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-900">Adres</label>
                      <textarea
                        name="guestAddress"
                        placeholder="Mahalle, sokak, bina ve daire bilgisi"
                        className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none transition focus:border-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-900">Posta kodu</label>
                      <input
                        name="guestPostalCode"
                        placeholder="Opsiyonel"
                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-900">Odeme yontemi</label>
                  <select
                    name="paymentMethod"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                    disabled={!hasSavedAddresses}
                  >
                    <option value="BANK_TRANSFER">Banka havalesi / EFT</option>
                    <option value="CASH_ON_DELIVERY">Kapida odeme</option>
                  </select>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-bold text-slate-900">Banka havalesi</p>
                      <p className="mt-2 leading-6">
                        Siparis olusur, odeme kaydi beklemede acilir ve admin dogrulamasi ile
                        onay sureci tamamlanir.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-bold text-slate-900">Kapida odeme</p>
                      <p className="mt-2 leading-6">
                        Manuel operasyon odakli kurulumlar icin daha hizli bir teslimat akisi saglar.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900">Kupon kodu</label>
                  <input
                    name="couponCode"
                    defaultValue={cart.couponCode ?? ""}
                    placeholder="Opsiyonel kupon kodu"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                    disabled={!hasSavedAddresses}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900">Siparis notu</label>
                  <textarea
                    name="customerNote"
                    placeholder="Kurye, teslimat veya operasyon notu"
                    className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none transition focus:border-emerald-700"
                    disabled={!hasSavedAddresses}
                  />
                </div>

                <Button className="w-full" size="lg" disabled={!hasSavedAddresses || cart.items.length === 0}>
                  Siparisi olustur
                </Button>
              </div>
            </form>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-100/75">
                  Siparis toplami
                </p>
                <div className="mt-6 space-y-3 text-sm text-white/80">
                  <div className="flex items-center justify-between">
                    <span>Ara toplam</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Indirim</span>
                    <span>-{formatPrice(totals.discountTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kargo</span>
                    <span>{formatPrice(totals.shippingTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 text-lg font-black text-white">
                    <span>Odenecek toplam</span>
                    <span>{formatPrice(totals.grandTotal)}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/80">
                  {settings?.checkoutMessage ??
                    "Siparis olusturuldugunda stok dusumu, inventory log ve odeme kaydi tek transaction icinde tamamlanir."}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Sepettekiler</h3>
                <div className="mt-4 space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-bold text-slate-950">{item.product.name}</p>
                        <p className="mt-1 text-slate-600">
                          {item.quantity} adet · Stok {item.product.stock}
                        </p>
                      </div>
                      <p className="font-bold text-slate-950">
                        {formatPrice(Number(item.product.salePrice ?? item.product.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {settings?.bankAccountInfo ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    <p className="font-bold text-slate-900">Banka/EFT bilgisi</p>
                    <p className="mt-2 whitespace-pre-line">{settings.bankAccountInfo}</p>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
