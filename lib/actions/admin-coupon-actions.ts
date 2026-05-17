"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  await requireAdmin();
  const data = buildCouponData(formData);

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new Error("Bu kupon kodu zaten kullaniliyor");

  await prisma.coupon.create({ data });
  revalidateCouponPaths();
}

export async function updateCouponAction(formData: FormData) {
  await requireAdmin();
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

  revalidateCouponPaths();
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "");
  if (!couponId) throw new Error("Kupon bulunamadi");

  await prisma.coupon.delete({ where: { id: couponId } });
  revalidateCouponPaths();
}
