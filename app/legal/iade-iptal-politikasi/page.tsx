import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function ReturnPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Satis sonrasi destek"
      title="Iade ve iptal politikasi"
      description="Iade ve iptal surecine iliskin yol haritasi burada ornek ve duzenlenebilir bir cati olarak sunulur."
      sections={[
        {
          title: "Siparis iptali",
          body: "Hazirlama veya sevk surecine girmemis siparisler icin iptal talebi destek kanallari uzerinden alinabilir."
        },
        {
          title: "Iade kosullari",
          body: "Kullanilmamis ve tekrar satisa uygun urunler, ilgili mevzuat ve urun tipi dikkate alinarak iade surecine alinabilir."
        },
        {
          title: "Ucret iadesi",
          body: "Onaylanan iade veya iptal taleplerinde geri odeme sureci odeme yontemine gore planlanmali ve kullanici bilgilendirilmelidir."
        }
      ]}
    />
  );
}
