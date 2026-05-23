"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword, clearSession } from "@/lib/auth";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validators";

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Gecersiz bilgi");
  }

  const fingerprint = await getRequestFingerprint();
  await enforceRateLimit({
    scope: "auth:register",
    key: `${parsed.data.email.toLowerCase()}|${fingerprint}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: "Cok fazla kayit denemesi yapildi. Lutfen daha sonra tekrar deneyin."
  });

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

async function authenticateUser(formData: FormData, scope: "customer" | "admin") {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("E-posta veya sifre hatali");
  }

  const fingerprint = await getRequestFingerprint();
  await enforceRateLimit({
    scope: "auth:login",
    key: `${parsed.data.email.toLowerCase()}|${fingerprint}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
    message: "Cok fazla giris denemesi yapildi. Lutfen 15 dakika sonra tekrar deneyin."
  });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    throw new Error("E-posta veya sifre hatali");
  }

  if (scope === "customer" && user.role === "ADMIN") {
    throw new Error("Admin hesaplari musteri girisinden degil admin giris ekranindan oturum acar.");
  }

  if (scope === "admin" && user.role !== "ADMIN") {
    throw new Error("Bu alan sadece admin hesaplari icindir.");
  }

  return user;
}

export async function customerLoginAction(formData: FormData) {
  const user = await authenticateUser(formData, "customer");
  await createSession({ userId: user.id, email: user.email, role: user.role });
  redirect("/");
}

export async function adminLoginAction(formData: FormData) {
  const user = await authenticateUser(formData, "admin");
  await createSession({ userId: user.id, email: user.email, role: user.role });
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
