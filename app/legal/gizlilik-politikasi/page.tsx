import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Yasal bilgilendirme"
      title="Gizlilik politikasi"
      description="Kullanici verilerinin gizlilik anlayisi, erisim prensipleri ve temel koruma yaklasimi bu sayfada ornek metin olarak yer alir."
      sections={[
        {
          title: "Toplanan bilgiler",
          body: "Siparis, teslimat, iletisim ve destek surecleri icin gerekli olan temel bilgiler sinirli amaclarla toplanabilir."
        },
        {
          title: "Kullanim alani",
          body: "Toplanan bilgiler urun sevkiyati, odeme dogrulamasi, musteri iletisimi ve hizmet kalitesinin iyilestirilmesi gibi sureclerde kullanilabilir."
        },
        {
          title: "Ucuncu taraf paylasimi",
          body: "Veriler ancak teslimat, odeme veya hukuki yukumluluk gibi gerekli senaryolarda ilgili hizmet saglayicilarla sinirli kapsamda paylasilmalidir."
        }
      ]}
    />
  );
}
