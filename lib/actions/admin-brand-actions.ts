"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  await requireAdmin();
  const data = buildBrandData(formData);
  await ensureUniqueBrandSlug(data.slug);

  await prisma.brand.create({ data });
  revalidateBrandPaths();
}

export async function updateBrandAction(formData: FormData) {
  await requireAdmin();
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) throw new Error("Marka bulunamadi");

  const data = buildBrandData(formData);
  await ensureUniqueBrandSlug(data.slug, brandId);

  await prisma.brand.update({
    where: { id: brandId },
    data
  });

  revalidateBrandPaths();
}

export async function deleteBrandAction(formData: FormData) {
  await requireAdmin();
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
  revalidateBrandPaths();
}
