import type { Metadata } from "next";
import { Footer } from "@/components/storefront/footer";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Adakan Commerce | Güvenli ve Hızlı Alışveriş",
    template: "%s | Adakan Commerce"
  },
  description:
    "Telefon aksesuarları, ofis ürünleri ve seçili teknoloji kategorilerinde güvenli ödeme ve hızlı teslimat deneyimi."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>
        <div className="min-h-screen">
          {children}
          <Footer settings={settings ?? {}} />
        </div>
      </body>
    </html>
  );
}
