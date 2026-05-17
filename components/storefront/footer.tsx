"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type FooterProps = {
  settings: {
    siteName?: string | null;
    contactPhone?: string | null;
    whatsappNumber?: string | null;
    email?: string | null;
    address?: string | null;
    instagram?: string | null;
  };
};

const quickLinks = [
  { href: "/", label: "Ana sayfa" },
  { href: "/products", label: "Urunler" },
  { href: "/categories", label: "Kategoriler" },
  { href: "/cart", label: "Sepet" },
  { href: "/orders", label: "Hesabim" }
];

const supportLinks = [
  { href: "/legal/iletisim", label: "Iletisim" },
  { href: "/legal/sikca-sorulan-sorular", label: "Sikca Sorulan Sorular" },
  { href: "/legal/kargo-ve-teslimat", label: "Kargo ve Teslimat" },
  { href: "/legal/iade-iptal-politikasi", label: "Iade ve Iptal Politikasi" },
  { href: "/legal/mesafeli-satis-sozlesmesi", label: "Mesafeli Satis Sozlesmesi" }
];

const legalLinks = [
  { href: "/legal/kvkk", label: "KVKK" },
  { href: "/legal/gizlilik-politikasi", label: "Gizlilik Politikasi" },
  { href: "/legal/kullanim-kosullari", label: "Kullanim Kosullari" },
  { href: "/legal/cerez-politikasi", label: "Cerez Politikasi" }
];

export function Footer({ settings }: FooterProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const siteName = settings.siteName || "Adakan Commerce";

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 xl:grid-cols-[1.2fr_.9fr_.9fr_.9fr_1fr]">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.3em] text-amber-300/80">
            {siteName}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Guvenli alisveris ve hizli destek deneyimi
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
            Telefon aksesuarlari, ofis urunleri ve secili teknoloji urunlerini guvenli odeme,
            hizli teslimat ve erisilebilir destek yapisiyla bulusturuyoruz.
          </p>
        </div>

        <FooterColumn title="Hizli erisim" links={quickLinks} />
        <FooterColumn title="Musteri hizmetleri" links={supportLinks} />
        <FooterColumn title="Yasal" links={legalLinks} />

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
              Iletisim
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>{settings.contactPhone || "+90 555 000 00 00"}</p>
              <p>{settings.whatsappNumber || "+90 555 000 00 00"}</p>
              <p>{settings.email || "info@adakancommerce.com"}</p>
              <p>{settings.address || "Van / Turkiye"}</p>
              <p>{settings.instagram || "instagram.com/adakansoftware"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
              Guven ve odeme
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Guvenli alisveris",
                "SSL korumali odeme",
                "EFT / Havale",
                "Kapida odeme"
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. Tum haklari saklidir.
          </p>
          <p>Powered by Adakan Software</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
