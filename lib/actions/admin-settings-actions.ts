"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteSettingsAdminSchema } from "@/lib/validators";

export async function updateSiteSettingsAction(formData: FormData) {
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

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
