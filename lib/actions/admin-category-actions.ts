"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  await requireAdmin();
  const data = buildCategoryData(formData);
  await ensureUniqueCategorySlug(data.slug);

  await prisma.category.create({ data });
  revalidateCategoryPaths();
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) throw new Error("Kategori bulunamadi");

  const data = buildCategoryData(formData);
  await ensureUniqueCategorySlug(data.slug, categoryId);

  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw new Error("Kategori bulunamadi");

  await prisma.category.update({
    where: { id: categoryId },
    data
  });

  revalidateCategoryPaths();
  revalidatePath(`/category/${existing.slug}`);
  if (existing.slug !== data.slug) revalidatePath(`/category/${data.slug}`);
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
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
  revalidateCategoryPaths();
  revalidatePath(`/category/${category.slug}`);
}
