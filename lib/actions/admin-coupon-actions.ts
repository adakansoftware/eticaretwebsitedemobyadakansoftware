"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { couponAdminSchema } from "@/lib/validators";

function buildCouponData(formData: FormData) {
  const parsed = couponAdminSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Kupon verisi hatali");
  }

  const { type, value, startsAt, endsAt, ...rest } = parsed.data;

  return {
    ...rest,
    code: parsed.data.code,
    discountAmount: type === "FIXED_AMOUNT" ? value : null,
    discountPercent: type === "PERCENTAGE" ? Math.round(value) : null,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null
  };
}

function revalidateCouponPaths() {
  revalidatePath("/admin/coupons");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function createCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:coupon-create",
    key: admin.id,
    limit: 20,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla kupon islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const data = buildCouponData(formData);

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new Error("Bu kupon kodu zaten kullaniliyor");

  await prisma.coupon.create({ data });
  await createAdminAuditLog({
    action: "CREATE",
    entityType: "COUPON",
    entityId: data.code,
    summary: `Kupon olusturuldu: ${data.code}`,
    metadata: { code: data.code, isActive: data.isActive }
  });
  revalidateCouponPaths();
}

export async function updateCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:coupon-update",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla kupon islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const couponId = String(formData.get("couponId") ?? "");
  if (!couponId) throw new Error("Kupon bulunamadi");

  const data = buildCouponData(formData);

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing && existing.id !== couponId) {
    throw new Error("Bu kupon kodu zaten kullaniliyor");
  }

  await prisma.coupon.update({
    where: { id: couponId },
    data
  });
  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "COUPON",
    entityId: couponId,
    summary: `Kupon guncellendi: ${data.code}`,
    metadata: { code: data.code, isActive: data.isActive }
  });

  revalidateCouponPaths();
}

export async function deleteCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:coupon-delete",
    key: admin.id,
    limit: 15,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla kupon silme islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const couponId = String(formData.get("couponId") ?? "");
  if (!couponId) throw new Error("Kupon bulunamadi");

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  await prisma.coupon.delete({ where: { id: couponId } });
  await createAdminAuditLog({
    action: "DELETE",
    entityType: "COUPON",
    entityId: couponId,
    summary: `Kupon silindi: ${coupon?.code ?? couponId}`,
    metadata: { code: coupon?.code ?? null }
  });
  revalidateCouponPaths();
}

export async function createCouponFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await createCouponAction(formData);
    return actionSuccess(undefined, "Kupon oluşturuldu.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Kupon oluşturulamadı.");
  }
}

export async function updateCouponFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateCouponAction(formData);
    return actionSuccess(undefined, "Kupon güncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Kupon güncellenemedi.");
  }
}

export async function deleteCouponFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await deleteCouponAction(formData);
    return actionSuccess(undefined, "Kupon silindi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Kupon silinemedi.");
  }
}
