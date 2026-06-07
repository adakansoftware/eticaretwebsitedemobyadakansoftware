"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminPermission, adminPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
import { createSlug } from "@/lib/slug";
import { categoryAdminSchema } from "@/lib/validators";

function buildCategoryData(formData: FormData) {
  const parsed = categoryAdminSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Kategori verisi hatali");
  }

  return {
    ...parsed.data,
    slug: parsed.data.slug ? createSlug(parsed.data.slug) : createSlug(parsed.data.name)
  };
}

async function ensureUniqueCategorySlug(slug: string, currentId?: string) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing && existing.id !== currentId) {
    throw new Error("Bu kategori slug'i zaten kullaniliyor");
  }
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createCategoryAction(formData: FormData) {
  await assertTrustedMutation("admin:category-create");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:category-create",
    key: admin.id,
    limit: 20,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla kategori islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const data = buildCategoryData(formData);
  await ensureUniqueCategorySlug(data.slug);

  const category = await prisma.category.create({ data });
  await createAdminAuditLog({
    action: "CREATE",
    entityType: "CATEGORY",
    entityId: category.id,
    summary: `Kategori olusturuldu: ${category.name}`,
    metadata: { slug: category.slug, isActive: category.isActive }
  }, { adminUserId: admin.id });
  revalidateCategoryPaths();
}

export async function updateCategoryAction(formData: FormData) {
  await assertTrustedMutation("admin:category-update");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:category-update",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla kategori islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) throw new Error("Kategori bulunamadi");

  const data = buildCategoryData(formData);
  await ensureUniqueCategorySlug(data.slug, categoryId);

  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw new Error("Kategori bulunamadi");

  const category = await prisma.category.update({
    where: { id: categoryId },
    data
  });
  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "CATEGORY",
    entityId: category.id,
    summary: `Kategori guncellendi: ${category.name}`,
    metadata: { slug: category.slug, isActive: category.isActive }
  }, { adminUserId: admin.id });

  revalidateCategoryPaths();
  revalidatePath(`/category/${existing.slug}`);
  if (existing.slug !== data.slug) revalidatePath(`/category/${data.slug}`);
}

export async function deleteCategoryAction(formData: FormData) {
  await assertTrustedMutation("admin:category-delete");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:category-delete",
    key: admin.id,
    limit: 15,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla kategori silme islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) throw new Error("Kategori bulunamadi");

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } }
  });

  if (!category) throw new Error("Kategori bulunamadi");
  if (category._count.products > 0) {
    throw new Error("Urun bagli kategori silinemez");
  }

  await prisma.category.delete({ where: { id: categoryId } });
  await createAdminAuditLog({
    action: "DELETE",
    entityType: "CATEGORY",
    entityId: category.id,
    summary: `Kategori silindi: ${category.name}`,
    metadata: { slug: category.slug }
  }, { adminUserId: admin.id });
  revalidateCategoryPaths();
  revalidatePath(`/category/${category.slug}`);
}
