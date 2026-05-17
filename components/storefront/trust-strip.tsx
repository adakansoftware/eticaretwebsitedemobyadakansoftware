import { BadgeCheck, CreditCard, MessageCircleMore, RotateCcw, Truck } from "lucide-react";

const items = [
  { icon: BadgeCheck, title: "Güvenli alışveriş", text: "SSL korumalı sipariş akışı" },
  { icon: Truck, title: "Hızlı kargo", text: "Hızlı teslimat süreci" },
  { icon: RotateCcw, title: "Kolay iade", text: "İade ve iptal adımları net" },
  { icon: MessageCircleMore, title: "WhatsApp destek", text: "Hızlı iletişim imkanı" },
  { icon: CreditCard, title: "EFT / Havale ve kapıda ödeme", text: "Esnek ödeme seçenekleri" }
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
