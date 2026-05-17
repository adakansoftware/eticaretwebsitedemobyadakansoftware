import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Yasal bilgilendirme"
      title="Kullanim kosullari"
      description="Web sitesi kullanimina iliskin temel kurallar ve hizmet sinirlari icin ornek bir cati."
      sections={[
        {
          title: "Site kullanim ilkeleri",
          body: "Ziyaretci ve kullanicilar, siteyi hukuka uygun amaclarla kullanmali ve hizmet akisina zarar verecek davranislardan kacinmalidir."
        },
        {
          title: "Icerik ve fiyat bilgisi",
          body: "Urun aciklamalari, fiyatlar ve kampanyalar operasyonel olarak guncellenebilir; nihai dogrulama siparis asamasinda yapilir."
        },
        {
          title: "Sorumluluk sinirlari",
          body: "Teknik kesinti, stok degisimi veya entegrasyon gecikmeleri gibi durumlarda kullanici bilgilendirilmesi esastir; ayrintilar canli projede netlestirilmelidir."
        }
      ]}
    />
  );
}
