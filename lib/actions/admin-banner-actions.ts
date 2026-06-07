"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdminPermission, adminPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
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
  await assertTrustedMutation("admin:banner-create");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:banner-create",
    key: admin.id,
    limit: 20,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla banner islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const data = buildBannerData(formData);

  const banner = await prisma.banner.create({ data });
  await createAdminAuditLog({
    action: "CREATE",
    entityType: "BANNER",
    entityId: banner.id,
    summary: `Banner olusturuldu: ${banner.title}`,
    metadata: { title: banner.title, isActive: banner.isActive }
  }, { adminUserId: admin.id });
  revalidateBannerPaths();
}

export async function updateBannerAction(formData: FormData) {
  await assertTrustedMutation("admin:banner-update");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:banner-update",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla banner islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const bannerId = String(formData.get("bannerId") ?? "");
  if (!bannerId) throw new Error("Banner bulunamadi");

  const data = buildBannerData(formData);

  const banner = await prisma.banner.update({
    where: { id: bannerId },
    data
  });
  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "BANNER",
    entityId: banner.id,
    summary: `Banner guncellendi: ${banner.title}`,
    metadata: { title: banner.title, isActive: banner.isActive }
  }, { adminUserId: admin.id });

  revalidateBannerPaths();
}

export async function deleteBannerAction(formData: FormData) {
  await assertTrustedMutation("admin:banner-delete");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:banner-delete",
    key: admin.id,
    limit: 15,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla banner silme islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const bannerId = String(formData.get("bannerId") ?? "");
  if (!bannerId) throw new Error("Banner bulunamadi");

  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  await prisma.banner.delete({ where: { id: bannerId } });
  await createAdminAuditLog({
    action: "DELETE",
    entityType: "BANNER",
    entityId: bannerId,
    summary: `Banner silindi: ${banner?.title ?? bannerId}`,
    metadata: { title: banner?.title ?? null }
  }, { adminUserId: admin.id });
  revalidateBannerPaths();
}

export async function createBannerFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await createBannerAction(formData);
    return actionSuccess(undefined, "Banner oluşturuldu.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Banner oluşturulamadı.");
  }
}

export async function updateBannerFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateBannerAction(formData);
    return actionSuccess(undefined, "Banner güncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Banner güncellenemedi.");
  }
}

export async function deleteBannerFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await deleteBannerAction(formData);
    return actionSuccess(undefined, "Banner silindi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Banner silinemedi.");
  }
}
