import { Header } from "@/components/storefront/header";
import { getCart, calculateCartTotals } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function CartPage() {
  const cart = await getCart();
  const totals = await calculateCartTotals(cart.id).catch(() => ({ subtotal: 0, shippingTotal: 0, discountTotal: 0, grandTotal: 0 }));
  return <><Header /><main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-black">Sepet</h1><div className="mt-8 grid gap-4">{cart.items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm"><div><h2 className="font-bold">{item.product.name}</h2><p className="text-sm text-slate-600">Adet: {item.quantity}</p></div><p className="font-black">{formatPrice(Number(item.product.price) * item.quantity)}</p></div>)}</div>{cart.items.length === 0 && <p className="mt-8 rounded-2xl bg-white p-8 text-slate-600">Sepetin boş.</p>}<aside className="mt-8 rounded-3xl bg-white p-6 shadow-sm"><div className="flex justify-between"><span>Ara toplam</span><b>{formatPrice(totals.subtotal)}</b></div><div className="mt-2 flex justify-between"><span>Kargo</span><b>{formatPrice(totals.shippingTotal)}</b></div><div className="mt-4 flex justify-between border-t pt-4 text-xl"><span>Toplam</span><b>{formatPrice(totals.grandTotal)}</b></div><Button asChild className="mt-6 w-full"><Link href="/checkout">Checkout</Link></Button></aside></main></>;
}
