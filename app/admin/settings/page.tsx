import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSiteSettingsFormAction } from "@/lib/actions/admin-settings-actions";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.findFirst();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-black tracking-tight text-white">Site ayarlari</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          Marka iletisim bilgileri, checkout mesajlari ve lojistik kurallari buradan guncellenir.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black text-white">Mevcut ozet</h2>
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Site adi</dt>
              <dd className="mt-1 font-bold text-white">{settings?.siteName ?? "Tanimsiz"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Instagram</dt>
              <dd className="mt-1 text-slate-200">{settings?.instagram ?? "Tanimsiz"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Kargo</dt>
              <dd className="mt-1 text-slate-200">
                {formatPrice(settings?.shippingFee?.toString() ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Ucretsiz kargo esigi</dt>
              <dd className="mt-1 text-slate-200">
                {settings?.freeShippingThreshold
                  ? formatPrice(settings.freeShippingThreshold.toString())
                  : "Kapali"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Checkout mesaji</dt>
              <dd className="mt-1 whitespace-pre-line text-slate-200">
                {settings?.checkoutMessage ?? "Tanimsiz"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black text-white">Ayarlari duzenle</h2>

          <AdminActionForm action={updateSiteSettingsFormAction} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="siteName" defaultValue={settings?.siteName ?? ""} placeholder="Site adi" required />
              <Input name="logoUrl" type="url" defaultValue={settings?.logoUrl ?? ""} placeholder="Logo URL" />
              <Input
                name="contactPhone"
                defaultValue={settings?.contactPhone ?? ""}
                placeholder="Iletisim telefonu"
              />
              <Input
                name="whatsappNumber"
                defaultValue={settings?.whatsappNumber ?? ""}
                placeholder="WhatsApp numarasi"
              />
              <Input name="email" type="email" defaultValue={settings?.email ?? ""} placeholder="E-posta" />
              <Input
                name="instagram"
                type="url"
                defaultValue={settings?.instagram ?? ""}
                placeholder="Instagram URL"
              />
              <Input
                name="primaryColor"
                defaultValue={settings?.primaryColor ?? ""}
                placeholder="#0f172a"
              />
              <Input
                name="shippingFee"
                type="number"
                step="0.01"
                defaultValue={Number(settings?.shippingFee ?? 0)}
                placeholder="Standart kargo ucreti"
                required
              />
              <Input
                name="freeShippingThreshold"
                type="number"
                step="0.01"
                defaultValue={settings?.freeShippingThreshold ? Number(settings.freeShippingThreshold) : ""}
                placeholder="Ucretsiz kargo esigi"
              />
            </div>

            <textarea
              name="address"
              defaultValue={settings?.address ?? ""}
              placeholder="Adres bilgisi"
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
            />
            <textarea
              name="checkoutMessage"
              defaultValue={settings?.checkoutMessage ?? ""}
              placeholder="Checkout mesaji"
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
            />
            <textarea
              name="bankAccountInfo"
              defaultValue={settings?.bankAccountInfo ?? ""}
              placeholder="Banka / EFT bilgileri"
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
            />

            <AdminSubmitButton
              className="w-full md:w-auto"
              idleLabel="Ayarlari kaydet"
              pendingLabel="Ayarlar kaydediliyor..."
            />
          </AdminActionForm>
        </div>
      </section>
    </div>
  );
}
