import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Yasal bilgilendirme"
      title="Cerez politikasi"
      description="Site deneyimi, tercih yonetimi ve temel analiz amacli cerez kullanimi icin ornek bir bilgilendirme metni."
      sections={[
        {
          title: "Cerez kullanimi",
          body: "Cerezler, oturum surekliligi, tercih hatirlama ve temel performans takibi gibi amaclarla kullanilabilir."
        },
        {
          title: "Tercih yonetimi",
          body: "Kullanici, tarayici ayarlarindan cerez tercihlerini yonetebilir; ancak bazı ozellikler bu durumda beklenen sekilde calismayabilir."
        },
        {
          title: "Analitik ve performans",
          body: "Canli projede kullanilan analitik ve performans cerezleri ayri sekilde aciklanmali ve gerekiyorsa acik riza sureci tanimlanmalidir."
        }
      ]}
    />
  );
}
