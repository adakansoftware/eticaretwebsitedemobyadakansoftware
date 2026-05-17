"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryAdjustmentSchema } from "@/lib/validators";

export async function adjustInventoryAction(formData: FormData) {
  await requireAdmin();

  const parsed = inventoryAdjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Envanter duzeltme verisi gecersiz");
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: parsed.data.productId }
    });

    if (!product) throw new Error("Urun bulunamadi");

    const change =
      parsed.data.direction === "INCREASE" ? parsed.data.quantity : -parsed.data.quantity;
    const nextStock = product.stock + change;

    if (nextStock < 0) {
      throw new Error("Stok sifirin altina dusurulemez");
    }

    await tx.product.update({
      where: { id: product.id },
      data: { stock: nextStock }
    });

    await tx.inventoryLog.create({
      data: {
        productId: product.id,
        change,
        stockAfter: nextStock,
        reason: parsed.data.reason,
        note: parsed.data.note
      }
    });
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
}
