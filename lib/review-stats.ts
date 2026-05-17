import { prisma } from "@/lib/prisma";

export async function syncProductReviewStats(productId: string) {
  const approvedReviews = await prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    select: { rating: true }
  });

  const ratingCount = approvedReviews.length;
  const ratingAverage =
    ratingCount > 0
      ? approvedReviews.reduce((total, review) => total + review.rating, 0) / ratingCount
      : 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingCount,
      ratingAverage
    }
  });
}
