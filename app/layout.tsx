import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/storefront/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Adakan Commerce | Guvenli ve Hizli Alisveris",
    template: "%s | Adakan Commerce"
  },
  description:
    "Telefon aksesuarlari, ofis urunleri ve secili teknoloji kategorilerinde guvenli odeme ve hizli teslimat deneyimi."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      siteName: true,
      contactPhone: true,
      whatsappNumber: true,
      email: true,
      address: true,
      instagram: true
    }
  });

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
