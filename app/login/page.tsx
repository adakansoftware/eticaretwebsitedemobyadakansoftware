import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { customerLoginAction } from "@/lib/actions/auth-actions";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <AuthShell
      mode="login"
      title="Giris akisini netlestirdik"
      description="Bu ekran artik sadece musteri hesaplari icin. Siparislerini, adreslerini ve favorilerini yonetmek icin buradan oturum ac."
      navigation={
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/login"
            className="rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-sm"
          >
            Musteri girisi
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-600 transition hover:text-slate-950"
          >
            Uye ol
          </Link>
          <Link
            href="/admin-login"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-950 transition hover:bg-emerald-100"
          >
            Admin girisi
          </Link>
        </div>
      }
      form={
        <form action={customerLoginAction} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Giris yap</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bu alan musteri girisi icin ayrildi. Admin hesabin varsa asagidaki ayri kapidan ilerle.
            </p>
          </div>

          <div className="grid gap-4">
            <Input name="email" type="email" placeholder="E-posta" required />
            <Input name="password" type="password" placeholder="Sifre" required />
            <Button className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800">
              Giris yap
            </Button>
          </div>

          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-bold">Admin misin?</p>
            <p className="mt-1 leading-6">
              Musteri girisi yerine{" "}
              <Link className="font-bold underline underline-offset-4" href="/admin-login">
                admin giris ekranini
              </Link>{" "}
              kullan.
            </p>
          </div>

          <p className="text-sm text-slate-600">
            Hesabin yok mu?{" "}
            <Link className="font-bold text-slate-950 hover:text-emerald-700" href="/register">
              Musteri hesabi olustur
            </Link>
          </p>
        </form>
      }
    />
  );
}
