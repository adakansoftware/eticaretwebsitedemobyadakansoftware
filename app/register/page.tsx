import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { registerAction } from "@/lib/actions/auth-actions";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <AuthShell
      mode="register"
      title="Uyelik ve admin girisini ayri okunan hale getirdik"
      description="Bu ekran sadece musteri hesabi acmak icin kullanilir. Admin hesaplari burada olusturulmaz; mevcut admin kullanicilari giris ekranindan oturum acar."
      navigation={
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-600 transition hover:text-slate-950"
          >
            Musteri girisi
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-sm"
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
        <form action={registerAction} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Uye ol</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Siparis, adres ve favori yonetimi icin musteri hesabini burada olusturabilirsin.
            </p>
          </div>

          <div className="grid gap-4">
            <Input name="name" placeholder="Ad soyad" required />
            <Input name="email" type="email" placeholder="E-posta" required />
            <Input name="password" type="password" placeholder="Sifre" required />
            <Button className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800">
              Musteri hesabi olustur
            </Button>
          </div>

          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-bold">Admin icin not:</p>
            <p className="mt-1 leading-6">
              Admin yetkisi bu ekrandan verilmez. Admin hesabin varsa{" "}
              <Link className="font-bold underline underline-offset-4" href="/admin-login">
                giris yap
              </Link>{" "}
              ve sistem seni panele yonlendirsin.
            </p>
          </div>

          <p className="text-sm text-slate-600">
            Zaten hesabin var mi?{" "}
            <Link className="font-bold text-slate-950 hover:text-emerald-700" href="/login">
              Giris yap
            </Link>
          </p>
        </form>
      }
    />
  );
}
