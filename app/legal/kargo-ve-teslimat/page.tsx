import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function ShippingPage() {
  return (
    <LegalPageShell
      eyebrow="Musteri hizmetleri"
      title="Kargo ve teslimat"
      description="Teslimat sureci, hazirlama adimlari ve kargo bilgilendirmesi icin ornek bir destek sayfasi."
      sections={[
        {
          title: "Hazirlama sureci",
          body: "Siparisler stok uygunluguna gore hazirlanir ve odeme durumuna bagli olarak operasyon sirasina alinir."
        },
        {
          title: "Teslimat bilgilendirmesi",
          body: "Kargo cikisi, takip numarasi ve tahmini teslimat suresi canli projede kargo entegrasyonu veya destek ekibi tarafindan paylasilmalidir."
        },
        {
          title: "Teslimatta dikkat edilmesi gerekenler",
          body: "Paket durumu, urun kontrolu ve hasar bildirimi gibi adimlar kullaniciya acik sekilde aktarilmalidir."
        }
      ]}
    />
  );
}
