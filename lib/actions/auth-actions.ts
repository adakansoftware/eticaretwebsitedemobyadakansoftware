"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword, clearSession } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validators";

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Gecersiz bilgi");
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    throw new Error("Bu e-posta zaten kayitli");
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password)
    }
  });

  await createSession({ userId: user.id, email: user.email, role: user.role });
  redirect("/");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("E-posta veya sifre hatali");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    throw new Error("E-posta veya sifre hatali");
  }

  await createSession({ userId: user.id, email: user.email, role: user.role });
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
