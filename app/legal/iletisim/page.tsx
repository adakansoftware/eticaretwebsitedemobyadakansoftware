import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { LegalPageShell } from "@/components/storefront/legal-page-shell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Iletisim",
  description: "Adakan Commerce ile siparis, destek ve iletisim kanallari uzerinden iletisime gecin."
};

export default async function ContactPage() {
  const settings = await prisma.siteSettings.findFirst();

  const contactCards = [
    { title: "Telefon", value: settings?.contactPhone ?? "+90 555 000 00 00" },
    { title: "WhatsApp", value: settings?.whatsappNumber ?? "+90 555 000 00 00" },
    { title: "E-posta", value: settings?.email ?? "info@adakancommerce.com" },
    { title: "Adres", value: settings?.address ?? "Van / Turkiye" },
    { title: "Instagram", value: settings?.instagram ?? "instagram.com/adakansoftware" }
  ];

  return (
    <LegalPageShell
      eyebrow="Destek ve iletisim"
      title="Iletisim"
      description="Siparis oncesi urun danismanligi, odeme surecleri ve siparis sonrasi destek icin bizimle iletisime gecebilirsiniz."
      sections={[
        {
          title: "Calisma saatleri",
          body: "Hafta ici 09:00 - 18:00 saatleri arasinda destek sureci aktif olarak takip edilir.\nHafta sonu iletileriniz siraya alinip en kisa surede geri donus saglanir."
        },
        {
          title: "Destek kapsami",
          body: "Siparis olusturma, EFT / Havale bilgilendirmesi, teslimat durumu ve iade surecleri icin iletisim kanallarimizi kullanabilirsiniz."
        }
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {contactCards.map((card) => (
            <article key={card.title} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black text-slate-950">{card.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {card.value}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xl font-black text-slate-950">Bize yazin</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Urun, siparis veya destek talepleriniz icin asagidaki formu kullanabilirsiniz.
          </p>

          <form className="mt-6 grid gap-4">
            <input
              placeholder="Ad soyad"
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
              placeholder="Mesajiniz"
              className="min-h-32 rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none"
            />
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              Bu form demo amaclidir; canli projede e-posta entegrasyonu eklenmelidir.
            </div>
            <Button disabled className="w-full md:w-auto">
              Gonderime hazir degil
            </Button>
          </form>
        </div>
      </div>
    </LegalPageShell>
  );
}
