import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function FaqPage() {
  return (
    <LegalPageShell
      eyebrow="Musteri hizmetleri"
      title="Sikca Sorulan Sorular"
      description="Siparis, odeme, teslimat ve iade surecleriyle ilgili temel sorulara yonelik bilgilendirme sayfasi."
      sections={[
        {
          title: "Siparisim ne zaman onaylanir?",
          body: "Kapida odeme siparisleri operasyon akisina gore hazirlanir. EFT / Havale siparislerinde odeme kontrolu sonrasi manuel onay sureci isler."
        },
        {
          title: "Kargo sureci nasil ilerler?",
          body: "Siparis durumu, stok uygunlugu ve hazirlama asamasina gore kargo sureci baslatilir. Yogun donemlerde bilgilendirme yapilmasi tavsiye edilir."
        },
        {
          title: "Iade talebi nasil iletilir?",
          body: "Iade ve iptal talepleri iletisim kanallari uzerinden alinabilir. Canli projede surec adimlari ve SLA bilgisi netlestirilmelidir."
        }
      ]}
    />
  );
}
