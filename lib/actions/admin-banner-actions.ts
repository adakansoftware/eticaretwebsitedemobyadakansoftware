"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bannerAdminSchema } from "@/lib/validators";

function buildBannerData(formData: FormData) {
  const parsed = bannerAdminSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Banner verisi hatali");
  }

  return parsed.data;
}

function revalidateBannerPaths() {
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function createBannerAction(formData: FormData) {
  await requireAdmin();
  const data = buildBannerData(formData);

  await prisma.banner.create({ data });
  revalidateBannerPaths();
}

export async function updateBannerAction(formData: FormData) {
  await requireAdmin();
  const bannerId = String(formData.get("bannerId") ?? "");
  if (!bannerId) throw new Error("Banner bulunamadi");

  const data = buildBannerData(formData);

  await prisma.banner.update({
    where: { id: bannerId },
    data
  });

  revalidateBannerPaths();
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin();
  const bannerId = String(formData.get("bannerId") ?? "");
  if (!bannerId) throw new Error("Banner bulunamadi");

  await prisma.banner.delete({ where: { id: bannerId } });
  revalidateBannerPaths();
}
