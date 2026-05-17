"use server";

import { revalidatePath } from "next/cache";
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
  await syncProductReviewStats(review.productId);
  revalidateReviewPaths(review.product.slug);
}
