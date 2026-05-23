"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProductReviewStats } from "@/lib/review-stats";
import { reviewStatusSchema } from "@/lib/validators";

function revalidateReviewPaths(productSlug?: string) {
  revalidatePath("/admin/reviews");
  revalidatePath("/products");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
}

export async function updateReviewStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = reviewStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Yorum verisi gecersiz");
  }

  const review = await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: { status: parsed.data.status },
    include: { product: true }
  });

  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "REVIEW",
    entityId: review.id,
    summary: `Yorum durumu guncellendi: ${review.product.name}`,
    metadata: { status: parsed.data.status, productId: review.productId }
  });
  await syncProductReviewStats(review.productId);
  revalidateReviewPaths(review.product.slug);
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  if (!reviewId) throw new Error("Yorum bulunamadi");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true }
  });

  if (!review) throw new Error("Yorum bulunamadi");

  await prisma.review.delete({ where: { id: reviewId } });
  await createAdminAuditLog({
    action: "DELETE",
    entityType: "REVIEW",
    entityId: reviewId,
    summary: `Yorum silindi: ${review.product.name}`,
    metadata: { productId: review.productId }
  });
  await syncProductReviewStats(review.productId);
  revalidateReviewPaths(review.product.slug);
}

export async function updateReviewStatusFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateReviewStatusAction(formData);
    return actionSuccess(undefined, "Yorum durumu güncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Yorum durumu güncellenemedi.");
  }
}

export async function deleteReviewFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await deleteReviewAction(formData);
    return actionSuccess(undefined, "Yorum silindi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Yorum silinemedi.");
  }
}
