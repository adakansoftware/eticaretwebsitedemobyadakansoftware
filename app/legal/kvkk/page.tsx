import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function KvkkPage() {
  return (
    <LegalPageShell
      eyebrow="Yasal bilgilendirme"
      title="KVKK"
      description="Kisisel verilerin korunmasi surecine iliskin bilgilendirme ve temel ilkeler bu sayfada ornek bir cati olarak sunulur."
      sections={[
        {
          title: "Veri isleme amaci",
          body: "Siparis surecleri, teslimat organizasyonu, odeme takibi ve musteri destegi gibi operasyonlarin saglikli yuruyebilmesi icin gerekli veriler islenebilir."
        },
        {
          title: "Saklama ve guvenlik",
          body: "Kullanici verileri yalnizca hizmet sureci, guvenlik ve mevzuat kapsaminda gerekli oldugu kadar saklanmali; erisim kontrolleri ve kayit altyapisi ile korunmalidir."
        },
        {
          title: "Basvuru haklari",
          body: "Veri sahibi, ilgili mevzuat kapsaminda bilgi alma, duzeltme talep etme ve gerekli hallerde silme basvurusu yapma hakkina sahiptir."
        }
      ]}
    />
  );
}
