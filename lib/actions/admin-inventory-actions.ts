"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdminPermission, adminPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
import { inventoryAdjustmentSchema } from "@/lib/validators";

async function adjustInventory(formData: FormData) {
  await assertTrustedMutation("admin:inventory-adjust");
  const admin = await requireAdminPermission(adminPermissions.inventoryWrite);
  await enforceRateLimit({
    scope: "admin:inventory-adjust",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla envanter islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });

  const parsed = inventoryAdjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Envanter duzeltme verisi gecersiz");
  }

  const auditContext = await prisma.$transaction(async (tx) => {
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

    return {
      productId: product.id,
      productName: product.name,
      nextStock
    };
  });

  await createAdminAuditLog({
    action: "ADJUST_INVENTORY",
    entityType: "PRODUCT",
    entityId: auditContext.productId,
    summary: `Envanter duzeltildi: ${auditContext.productName}`,
    metadata: {
      direction: parsed.data.direction,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      stockAfter: auditContext.nextStock
    }
  }, { adminUserId: admin.id });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function adjustInventoryAction(formData: FormData) {
  await adjustInventory(formData);
}

export async function adjustInventoryFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await adjustInventory(formData);
    return actionSuccess(undefined, "Envanter güncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Envanter güncellenemedi.");
  }
}
