import { BadgeCheck, CreditCard, MessageCircleMore, RotateCcw, Truck } from "lucide-react";

const items = [
  { icon: BadgeCheck, title: "Guvenli alisveris", text: "SSL korumali siparis akisi" },
  { icon: Truck, title: "Hizli kargo", text: "Operasyon odakli teslimat sureci" },
  { icon: RotateCcw, title: "Kolay iade", text: "Iade ve iptal adimlari net" },
  { icon: MessageCircleMore, title: "WhatsApp destek", text: "Hizli iletisim imkani" },
  { icon: CreditCard, title: "EFT / Havale ve kapida odeme", text: "Esnek odeme secenekleri" }
];

export function TrustStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="grid gap-4 rounded-[2.2rem] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-[1.5rem] bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-emerald-900" />
              <h2 className="mt-3 text-sm font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-600">{item.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
