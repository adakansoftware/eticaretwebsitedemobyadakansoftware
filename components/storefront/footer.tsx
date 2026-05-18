"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BadgeCheck, Headphones, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

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
  { href: "/products", label: "Ürünler" },
  { href: "/categories", label: "Kategoriler" },
  { href: "/cart", label: "Sepet" },
  { href: "/orders", label: "Hesabım" }
];

const supportLinks = [
  { href: "/legal/iletisim", label: "İletişim" },
  { href: "/legal/kargo-ve-teslimat", label: "Kargo ve Teslimat" },
  { href: "/legal/iade-iptal-politikasi", label: "İade ve İptal Politikası" },
  { href: "/legal/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" }
];

const legalLinks = [
  { href: "/legal/kvkk", label: "KVKK" },
  { href: "/legal/gizlilik-politikasi", label: "Gizlilik Politikası" }
];

const trustItems = [
  "Güvenli alışveriş",
  "SSL korumalı ödeme",
  "EFT / Havale",
  "Kapıda ödeme"
];

export function Footer({ settings }: FooterProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const siteName = settings.siteName || "Adakan Commerce";
  const phone = settings.contactPhone || "+90 555 000 00 00";
  const whatsapp = settings.whatsappNumber || "+90 555 000 00 00";
  const email = settings.email || "info@adakancommerce.com";
  const address = settings.address || "Van / Türkiye";
  const instagram = settings.instagram || "instagram.com/adakansoftware";

  return (
    <footer className="mt-20 overflow-hidden border-t border-slate-200/70 bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pt-10">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-700 px-6 py-7 shadow-[0_24px_80px_rgba(2,6,23,0.28)] md:px-8">
          <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.32em] text-emerald-100/85">
                Destek ve güven
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                Sipariş öncesi ve sonrası her adımda yanınızdayız
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85 md:text-base">
                Ürün seçimi, ödeme, teslimat ve destek süreçlerinde hızlı iletişim ve güvenli alışveriş
                deneyimi sunuyoruz.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <QuickContactCard
                icon={Phone}
                label="Telefon desteği"
                value={phone}
                href={`tel:${phone.replace(/\s+/g, "")}`}
              />
              <QuickContactCard
                icon={MessageCircle}
                label="WhatsApp destek"
                value={whatsapp}
                href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 xl:grid-cols-[1.2fr_.8fr_.8fr_.8fr_1fr]">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.3em] text-amber-300/80">
            {siteName}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Güvenli alışveriş ve hızlı destek deneyimi
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
            Telefon aksesuarları, ofis ürünleri ve seçili teknoloji ürünlerini güvenli ödeme,
            hızlı teslimat ve erişilebilir destek yapısıyla buluşturuyoruz.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoBadge icon={BadgeCheck} text="Güvenli alışveriş" />
            <InfoBadge icon={Headphones} text="WhatsApp destek" />
          </div>
        </div>

        <FooterColumn title="Hızlı erişim" links={quickLinks} />
        <FooterColumn title="Müşteri hizmetleri" links={supportLinks} />
        <FooterColumn title="Yasal" links={legalLinks} />

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
              İletişim
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <ContactLine icon={Phone} value={phone} href={`tel:${phone.replace(/\s+/g, "")}`} />
              <ContactLine
                icon={MessageCircle}
                value={whatsapp}
                href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
              />
              <ContactLine icon={Mail} value={email} href={`mailto:${email}`} />
              <ContactLine icon={MapPin} value={address} />
              <ContactLine icon={Instagram} value={instagram} href={normalizeExternalUrl(instagram)} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
              Güven ve ödeme
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {trustItems.map((item) => (
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
          <p>© 2026 {siteName}. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-5">
            <Link href="/legal/iletisim" className="transition hover:text-white">
              İletişim
            </Link>
            <Link href="/legal/gizlilik-politikasi" className="transition hover:text-white">
              Gizlilik Politikası
            </Link>
            <p>Powered by Adakan Software</p>
          </div>
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
            <Link href={link.href} className="inline-flex items-center gap-2 transition hover:text-white">
              <ArrowRight className="h-3.5 w-3.5 text-amber-300" />
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBadge({
  icon: Icon,
  text
}: {
  icon: typeof BadgeCheck;
  text: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-300" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function QuickContactCard({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur transition hover:bg-white/15"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
    >
      <Icon className="h-5 w-5 text-amber-200" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-100/80">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </a>
  );
}

function ContactLine({
  icon: Icon,
  value,
  href
}: {
  icon: typeof Phone;
  value: string;
  href?: string;
}) {
  const content = (
    <span className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-amber-300" />
      <span>{value}</span>
    </span>
  );

  if (!href) {
    return <p>{content}</p>;
  }

  return (
    <a
      href={href}
      className="transition hover:text-white"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
    >
      {content}
    </a>
  );
}

function normalizeExternalUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}
