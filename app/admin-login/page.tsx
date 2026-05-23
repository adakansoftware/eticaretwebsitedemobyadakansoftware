import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLoginAction } from "@/lib/actions/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (user?.role === "USER") {
    redirect("/");
  }

  return (
    <AuthShell
      mode="login"
      title="Admin girisini musteri akısından tamamen ayirdik"
      description="Bu alan sadece yonetim ekibi icin. Admin hesabinla oturum actiginda dogrudan operasyon paneline gecersin."
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
            className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-600 transition hover:text-slate-950"
          >
            Uye ol
          </Link>
          <Link
            href="/admin-login"
            className="rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-sm"
          >
            Admin girisi
          </Link>
        </div>
      }
      form={
        <form action={adminLoginAction} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Admin girisi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bu form yalnizca admin rolune sahip kullanicilar icin calisir. Musteri hesabiyla giris
              denenirse sistem bunu kabul etmez.
            </p>
          </div>

          <div className="grid gap-4">
            <Input name="email" type="email" placeholder="Admin e-postasi" required />
            <Input name="password" type="password" placeholder="Sifre" required />
            <Button className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800">
              Admin olarak gir
            </Button>
          </div>

          <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
            <p className="font-bold">Musteri hesabi mi kullanacaksin?</p>
            <p className="mt-1 leading-6">
              Siparis ve hesap yonetimi icin{" "}
              <Link className="font-bold underline underline-offset-4" href="/login">
                musteri giris ekranina
              </Link>{" "}
              don.
            </p>
          </div>
        </form>
      }
    />
  );
}
