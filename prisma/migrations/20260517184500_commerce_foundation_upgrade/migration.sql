-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Brand" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "public"."Cart" ADD COLUMN     "couponCode" TEXT;

-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "public"."InventoryLog" ADD COLUMN     "stockAfter" INTEGER;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "couponCode" TEXT;

-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "productBrand" TEXT,
ADD COLUMN     "productImage" TEXT,
ADD COLUMN     "productSlug" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "confirmedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "ratingAverage" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salePrice" DECIMAL(12,2),
ADD COLUMN     "searchKeywords" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "barcode" TEXT;

-- AlterTable
ALTER TABLE "public"."SiteSettings" ADD COLUMN     "checkoutMessage" TEXT,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'TRY';

-- CreateTable
CREATE TABLE "public"."ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAttribute_productId_idx" ON "public"."ProductAttribute"("productId");

-- CreateIndex
CREATE INDEX "Review_productId_status_idx" ON "public"."Review"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_productId_key" ON "public"."Review"("userId", "productId");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "public"."WishlistItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "public"."WishlistItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "public"."Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_name_sku_idx" ON "public"."Product"("name", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "public"."ProductVariant"("barcode");

-- AddForeignKey
ALTER TABLE "public"."ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
