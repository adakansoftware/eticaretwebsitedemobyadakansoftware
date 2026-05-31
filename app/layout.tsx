import type { Metadata } from "next";
import { Footer } from "@/components/storefront/footer";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName ?? "Adakan Commerce";

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
      default: `${siteName} | Guvenli ve Hizli Alisveris`,
      template: `%s | ${siteName}`
    },
    description:
      "Telefon aksesuarlari, ofis urunleri ve secili teknoloji kategorilerinde guvenli odeme ve hizli teslimat deneyimi."
  };
}

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
