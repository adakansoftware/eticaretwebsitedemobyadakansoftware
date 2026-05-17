"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productAdminSchema } from "@/lib/validators";

export async function updateOrderStatusAction(orderId: string, status: string, adminNote?: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { status: status as any, adminNote } });
  revalidatePath("/admin/orders");
}

export async function createProductAction(_: unknown, formData: FormData) {
  await requireAdmin();
  const parsed = productAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ürün verisi hatalı" };
  await prisma.product.create({ data: parsed.data });
  revalidatePath("/admin/products");
  return { ok: true };
}
