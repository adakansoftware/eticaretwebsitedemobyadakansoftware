import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.findFirst();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Site ayarlari</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          Checkout mesajlari, banka bilgisi ve lojistik kurallari burada gorunur.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black text-white">Marka ve iletisim</h2>
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Site adi</dt>
              <dd className="mt-1 font-bold text-white">{settings?.siteName ?? "Tanimsiz"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">E-posta</dt>
              <dd className="mt-1 text-slate-200">{settings?.email ?? "Tanimsiz"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Telefon</dt>
              <dd className="mt-1 text-slate-200">{settings?.contactPhone ?? "Tanimsiz"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">WhatsApp</dt>
              <dd className="mt-1 text-slate-200">{settings?.whatsappNumber ?? "Tanimsiz"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Adres</dt>
              <dd className="mt-1 whitespace-pre-line text-slate-200">{settings?.address ?? "Tanimsiz"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-black text-white">Checkout ve lojistik</h2>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-400">Para birimi</dt>
                <dd className="font-bold text-white">{settings?.currencyCode ?? "TRY"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-400">Standart kargo</dt>
                <dd className="font-bold text-white">
                  {formatPrice(settings?.shippingFee?.toString() ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-400">Ucretsiz kargo esigi</dt>
                <dd className="font-bold text-white">
                  {settings?.freeShippingThreshold
                    ? formatPrice(settings.freeShippingThreshold.toString())
                    : "Kapali"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-black text-white">Checkout mesaji</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
              {settings?.checkoutMessage ??
                "Checkout mesaji tanimlanmamis. Burasi kullanicinin siparis oncesi gordugu operasyon notunu tutar."}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-black text-white">Banka / EFT bilgisi</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
              {settings?.bankAccountInfo ?? "Banka bilgisi tanimlanmamis."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
