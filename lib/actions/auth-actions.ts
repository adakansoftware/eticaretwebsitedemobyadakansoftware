"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { sendPasswordResetEmail } from "@/lib/emails/password-reset";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword, clearSession, requireUser } from "@/lib/auth";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from "@/lib/validators";

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

export async function forgotPasswordAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Gecerli bir e-posta adresi gir");
  }

  const fingerprint = await getRequestFingerprint();

  try {
    await enforceRateLimit({
      scope: "auth:forgot-password",
      key: `${parsed.data.email.toLowerCase()}|${fingerprint}`,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Cok fazla parola sifirlama talebi alindi. Lutfen 15 dakika sonra tekrar deneyin."
    });
  } catch (error) {
    return actionError(
      error instanceof Error
        ? error.message
        : "Cok fazla parola sifirlama talebi alindi. Lutfen daha sonra tekrar deneyin."
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token
      });
    } catch (error) {
      console.error("Parola sifirlama e-postasi gonderilemedi", error);
    }
  }

  return actionSuccess(
    undefined,
    "E-posta adresi kayitliysa sifirlama baglantisi gonderilecektir."
  );
}

export async function resetPasswordAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return actionError(firstIssue?.message ?? "Sifre sifirlama formu gecersiz");
  }

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true }
  });

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
    return actionError("Sifirlama baglantisi gecersiz veya suresi dolmus.");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash }
    });

    await tx.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() }
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: tokenRecord.userId,
        usedAt: null,
        id: { not: tokenRecord.id }
      },
      data: { usedAt: new Date() }
    });
  });

  return actionSuccess(undefined, "Sifren basariyla guncellendi. Simdi giris yapabilirsin.");
}

export async function changePasswordAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return actionError(firstIssue?.message ?? "Sifre degistirme formu gecersiz");
  }

  const fingerprint = await getRequestFingerprint();

  try {
    await enforceRateLimit({
      scope: "auth:change-password",
      key: `${user.id}|${fingerprint}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Cok fazla sifre degistirme denemesi yapildi. Lutfen daha sonra tekrar deneyin."
    });
  } catch (error) {
    return actionError(
      error instanceof Error
        ? error.message
        : "Cok fazla sifre degistirme denemesi yapildi. Lutfen daha sonra tekrar deneyin."
    );
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!fullUser) {
    return actionError("Kullanici hesabi bulunamadi.");
  }

  const isCurrentPasswordValid = await verifyPassword(
    parsed.data.currentPassword,
    fullUser.passwordHash
  );

  if (!isCurrentPasswordValid) {
    return actionError("Mevcut sifren hatali.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword)
    }
  });

  return actionSuccess(undefined, "Sifren basariyla guncellendi.");
}
