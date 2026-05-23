"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteSettingsAdminSchema } from "@/lib/validators";

async function updateSiteSettings(formData: FormData) {
  await requireAdmin();

  const parsed = siteSettingsAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Site ayarlari gecersiz");
  }

  const current = await prisma.siteSettings.findFirst();

  if (current) {
    await prisma.siteSettings.update({
      where: { id: current.id },
      data: parsed.data
    });
  } else {
    await prisma.siteSettings.create({
      data: {
        currencyCode: "TRY",
        ...parsed.data
      }
    });
  }

  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "SITE_SETTINGS",
    entityId: current?.id ?? "SITE_SETTINGS",
    summary: "Site ayarlari guncellendi",
    metadata: {
      siteName: parsed.data.siteName,
      shippingFee: parsed.data.shippingFee,
      freeShippingThreshold: parsed.data.freeShippingThreshold ?? null
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function updateSiteSettingsAction(formData: FormData) {
  await updateSiteSettings(formData);
}

export async function updateSiteSettingsFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateSiteSettings(formData);
    return actionSuccess(undefined, "Site ayarları güncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Site ayarları güncellenemedi.");
  }
}
