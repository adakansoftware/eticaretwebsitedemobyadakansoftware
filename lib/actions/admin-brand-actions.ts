"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
import { createSlug } from "@/lib/slug";
import { brandAdminSchema } from "@/lib/validators";

function buildBrandData(formData: FormData) {
  const parsed = brandAdminSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Marka verisi hatali");
  }

  return {
    ...parsed.data,
    slug: parsed.data.slug ? createSlug(parsed.data.slug) : createSlug(parsed.data.name)
  };
}

async function ensureUniqueBrandSlug(slug: string, currentId?: string) {
  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (existing && existing.id !== currentId) {
    throw new Error("Bu marka slug'i zaten kullaniliyor");
  }
}

function revalidateBrandPaths() {
  revalidatePath("/admin/brands");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createBrandAction(formData: FormData) {
  await assertTrustedMutation("admin:brand-create");
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:brand-create",
    key: admin.id,
    limit: 20,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla marka islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const data = buildBrandData(formData);
  await ensureUniqueBrandSlug(data.slug);

  const brand = await prisma.brand.create({ data });
  await createAdminAuditLog({
    action: "CREATE",
    entityType: "BRAND",
    entityId: brand.id,
    summary: `Marka olusturuldu: ${brand.name}`,
    metadata: { slug: brand.slug, isActive: brand.isActive }
  }, { adminUserId: admin.id });
  revalidateBrandPaths();
}

export async function updateBrandAction(formData: FormData) {
  await assertTrustedMutation("admin:brand-update");
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:brand-update",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla marka islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) throw new Error("Marka bulunamadi");

  const data = buildBrandData(formData);
  await ensureUniqueBrandSlug(data.slug, brandId);

  const brand = await prisma.brand.update({
    where: { id: brandId },
    data
  });
  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "BRAND",
    entityId: brand.id,
    summary: `Marka guncellendi: ${brand.name}`,
    metadata: { slug: brand.slug, isActive: brand.isActive }
  }, { adminUserId: admin.id });

  revalidateBrandPaths();
}

export async function deleteBrandAction(formData: FormData) {
  await assertTrustedMutation("admin:brand-delete");
  const admin = await requireAdmin();
  await enforceRateLimit({
    scope: "admin:brand-delete",
    key: admin.id,
    limit: 15,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla marka silme islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) throw new Error("Marka bulunamadi");

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { _count: { select: { products: true } } }
  });

  if (!brand) throw new Error("Marka bulunamadi");
  if (brand._count.products > 0) {
    throw new Error("Urun bagli marka silinemez");
  }

  await prisma.brand.delete({ where: { id: brandId } });
  await createAdminAuditLog({
    action: "DELETE",
    entityType: "BRAND",
    entityId: brand.id,
    summary: `Marka silindi: ${brand.name}`,
    metadata: { slug: brand.slug }
  }, { adminUserId: admin.id });
  revalidateBrandPaths();
}
