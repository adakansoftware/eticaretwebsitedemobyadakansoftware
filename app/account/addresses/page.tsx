import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAddressAction,
  deleteAddressAction,
  updateAddressAction
} from "@/lib/actions/address-actions";

const accountTabs = [
  { href: "/account/addresses", label: "Adresler" },
  { href: "/account/wishlist", label: "Favoriler" },
  { href: "/account/password", label: "Sifre" }
] as const;

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Adreslerim</h1>
            <p className="mt-2 text-slate-600">
              Checkout oncesi teslimat adreslerini buradan yonetebilirsin.
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-3">
          {accountTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                tab.href === "/account/addresses"
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Yeni adres ekle</h2>
          <AddressForm action={createAddressAction} submitLabel="Adresi kaydet" />
        </section>

        <section className="mt-8 grid gap-4">
          {addresses.length === 0 ? (
            <div className="rounded-3xl bg-amber-50 p-6 text-amber-900">
              Henuz kayitli adresin yok. Ilk adresini ekledikten sonra checkout akisinda secerek
              kullanabilirsin.
            </div>
          ) : (
            addresses.map((address: AddressRecord) => (
              <article key={address.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">{address.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {address.fullName} · {address.city}/{address.district}
                      {address.isDefault ? " · Varsayilan" : ""}
                    </p>
                  </div>
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <Button variant="outline">Adresi sil</Button>
                  </form>
                </div>

                <AddressForm
                  action={updateAddressAction}
                  submitLabel="Degisiklikleri kaydet"
                  addressId={address.id}
                  defaultValues={address}
                />
              </article>
            ))
          )}
        </section>
      </main>
    </>
  );
}

type AddressRecord = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  postalCode: string | null;
  isDefault: boolean;
};

function AddressForm({
  action,
  submitLabel,
  addressId,
  defaultValues
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  addressId?: string;
  defaultValues?: {
    title: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    postalCode: string | null;
    isDefault: boolean;
  };
}) {
  return (
    <form action={action} className="mt-6 grid gap-4">
      {addressId ? <input type="hidden" name="addressId" value={addressId} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          name="title"
          placeholder="Adres basligi"
          defaultValue={defaultValues?.title}
          required
        />
        <Input
          name="fullName"
          placeholder="Teslim alacak kisi"
          defaultValue={defaultValues?.fullName}
          required
        />
        <Input
          name="phone"
          placeholder="Telefon"
          defaultValue={defaultValues?.phone}
          required
        />
        <Input
          name="postalCode"
          placeholder="Posta kodu"
          defaultValue={defaultValues?.postalCode ?? ""}
        />
        <Input name="city" placeholder="Sehir" defaultValue={defaultValues?.city} required />
        <Input
          name="district"
          placeholder="Ilce"
          defaultValue={defaultValues?.district}
          required
        />
      </div>
      <textarea
        name="address"
        placeholder="Mahalle, sokak, bina ve daire bilgileri"
        defaultValue={defaultValues?.address}
        required
        className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none ring-slate-950/10 transition focus:ring-4"
      />
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={defaultValues?.isDefault}
          className="h-4 w-4 rounded border-slate-300"
        />
        Varsayilan adres yap
      </label>
      <Button className="w-full md:w-auto">{submitLabel}</Button>
    </form>
  );
}
