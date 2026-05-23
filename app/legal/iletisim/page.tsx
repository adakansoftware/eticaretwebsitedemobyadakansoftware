import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/storefront/header";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Sipariş, ürün ve destek talepleriniz için Adakan Commerce ile iletişime geçin."
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const contactCards = [
    { title: "Telefon", value: settings?.contactPhone ?? "+90 555 000 00 00" },
    { title: "WhatsApp", value: settings?.whatsappNumber ?? "+90 555 000 00 00" },
    { title: "E-posta", value: settings?.email ?? "info@adakancommerce.com" },
    { title: "Adres", value: settings?.address ?? "Van / Türkiye" },
    { title: "Instagram", value: settings?.instagram ?? "instagram.com/adakansoftware" }
  ];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-amber-700">
                Destek ve iletişim
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                İletişim
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Sipariş, ürün ve destek talepleriniz için bizimle iletişime geçebilirsiniz.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {contactCards.map((card) => (
                  <article
                    key={card.title}
                    className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <h2 className="text-lg font-black text-slate-950">{card.title}</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {card.value}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-[1.8rem] border border-emerald-100 bg-emerald-50/70 p-5">
                <h2 className="text-lg font-black text-slate-950">Çalışma saatleri</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Pazartesi - Cumartesi: 09:00 - 18:00
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Sipariş öncesi ürün danışmanlığı, EFT / Havale bilgilendirmesi, teslimat
                  durumu ve iade süreçleri için destek sağlıyoruz.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Bize yazın</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Destek talebinizi iletmek için aşağıdaki formu kullanabilirsiniz.
              </p>

              <form className="mt-6 grid gap-4">
                <input
                  placeholder="Ad Soyad"
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="email"
                    placeholder="E-posta"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                  />
                  <input
                    placeholder="Telefon"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                  />
                </div>
                <textarea
                  placeholder="Mesaj"
                  className="min-h-36 rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none"
                />
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                  Bu form demo amaçlıdır; canlı projede e-posta entegrasyonu eklenmelidir.
                </div>
                <Button disabled className="w-full md:w-auto">
                  Gönder
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
