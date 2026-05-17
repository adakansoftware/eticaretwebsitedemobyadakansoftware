import { Header } from "@/components/storefront/header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutAction } from "@/lib/actions/checkout-actions";
import { Button } from "@/components/ui/button";

export default async function CheckoutPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id } });
  return <><Header /><main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-black">Checkout</h1>{addresses.length === 0 && <p className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-900">Seed kullanıcıda adres vardır. Yeni kullanıcı için önce adres yönetimi modülü geliştirilecek.</p>}<form action={checkoutAction} className="mt-8 rounded-3xl bg-white p-6 shadow-sm"><label className="font-bold">Adres</label><select name="addressId" className="mt-2 h-12 w-full rounded-xl border px-4">{addresses.map((a) => <option key={a.id} value={a.id}>{a.title} - {a.city}/{a.district}</option>)}</select><label className="mt-5 block font-bold">Ödeme yöntemi</label><select name="paymentMethod" className="mt-2 h-12 w-full rounded-xl border px-4"><option value="BANK_TRANSFER">Banka havalesi / EFT</option><option value="CASH_ON_DELIVERY">Kapıda ödeme</option></select><textarea name="customerNote" placeholder="Sipariş notu" className="mt-5 min-h-28 w-full rounded-xl border p-4" /><Button className="mt-5 w-full">Siparişi oluştur</Button></form></main></>;
}
