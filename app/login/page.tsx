import Link from "next/link";
import { loginAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4"><form action={loginAction} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-black">Giriş yap</h1><p className="mt-2 text-slate-600">Hesabına veya admin paneline giriş yap.</p><div className="mt-6 grid gap-4"><Input name="email" type="email" placeholder="E-posta" required /><Input name="password" type="password" placeholder="Şifre" required /><Button>Giriş yap</Button></div><p className="mt-5 text-sm text-slate-600">Hesap yok mu? <Link className="font-bold" href="/register">Kayıt ol</Link></p></form></main>;
}
