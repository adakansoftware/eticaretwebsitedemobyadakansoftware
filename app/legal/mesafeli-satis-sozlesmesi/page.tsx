import { LegalPageShell } from "@/components/storefront/legal-page-shell";

export default function DistanceSalesPage() {
  return (
    <LegalPageShell
      eyebrow="Yasal bilgilendirme"
      title="Mesafeli satis sozlesmesi"
      description="Siparis, teslimat ve tuketici haklari kapsaminda kullanilabilecek ornek bir mesafeli satis sozlesmesi catisi."
      sections={[
        {
          title: "Taraflar ve konu",
          body: "Satici ile alici arasindaki siparis, odeme ve teslimat surecine iliskin temel sartlar bu bolumde tanimlanir."
        },
        {
          title: "Teslimat ve odeme",
          body: "Siparisin hazirlanmasi, odeme yontemi, teslimat sekli ve tahmini surec adimlari acikca belirtilmelidir."
        },
        {
          title: "Cayma hakki ve uyusmazlik",
          body: "Tuketici haklari, cayma suresi ve olasi uyusmazlik durumlarinda izlenecek yol ilgili mevzuata uygun sekilde duzenlenmelidir."
        }
      ]}
    />
  );
}
