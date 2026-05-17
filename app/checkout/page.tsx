import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutAction } from "@/lib/actions/checkout-actions";
import { Button } from "@/components/ui/button";

export default async function CheckoutPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black">Checkout</h1>

        {addresses.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-900">
            <p>Checkout icin once en az bir teslimat adresi eklemelisin.</p>
            <Link href="/account/addresses" className="mt-3 inline-block font-bold underline">
              Adreslerimi yonet
            </Link>
          </div>
        ) : null}

        <form action={checkoutAction} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <label className="font-bold">Adres</label>
          <select
            name="addressId"
            className="mt-2 h-12 w-full rounded-xl border px-4"
            disabled={addresses.length === 0}
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.title} - {address.city}/{address.district}
                {address.isDefault ? " (Varsayilan)" : ""}
              </option>
            ))}
          </select>

          <label className="mt-5 block font-bold">Odeme yontemi</label>
          <select
            name="paymentMethod"
            className="mt-2 h-12 w-full rounded-xl border px-4"
            disabled={addresses.length === 0}
          >
            <option value="BANK_TRANSFER">Banka havalesi / EFT</option>
            <option value="CASH_ON_DELIVERY">Kapida odeme</option>
          </select>

          <textarea
            name="customerNote"
            placeholder="Siparis notu"
            className="mt-5 min-h-28 w-full rounded-xl border p-4"
            disabled={addresses.length === 0}
          />

          <Button className="mt-5 w-full" disabled={addresses.length === 0}>
            Siparisi olustur
          </Button>
        </form>
      </main>
    </>
  );
}
