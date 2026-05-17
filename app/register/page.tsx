import Link from "next/link";
import { registerAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4"><form action={registerAction} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-black">Kayıt ol</h1><p className="mt-2 text-slate-600">Sipariş ve adres yönetimi için hesap oluştur.</p><div className="mt-6 grid gap-4"><Input name="name" placeholder="Ad soyad" required /><Input name="email" type="email" placeholder="E-posta" required /><Input name="password" type="password" placeholder="Şifre" required /><Button>Kayıt ol</Button></div><p className="mt-5 text-sm text-slate-600">Hesabın var mı? <Link className="font-bold" href="/login">Giriş yap</Link></p></form></main>;
}
