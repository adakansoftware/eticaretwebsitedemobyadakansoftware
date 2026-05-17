import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const s = await prisma.siteSettings.findFirst();
  return <div><h1 className="text-3xl font-black">Site ayarları</h1><div className="mt-8 rounded-3xl bg-white/10 p-6"><dl className="grid gap-4 text-sm"><div><dt className="text-slate-400">Site adı</dt><dd className="font-bold">{s?.siteName}</dd></div><div><dt className="text-slate-400">WhatsApp</dt><dd>{s?.whatsappNumber}</dd></div><div><dt className="text-slate-400">Kargo</dt><dd>{formatPrice(s?.shippingFee?.toString() ?? 0)}</dd></div><div><dt className="text-slate-400">EFT Bilgisi</dt><dd>{s?.bankAccountInfo}</dd></div></dl></div></div>;
}
