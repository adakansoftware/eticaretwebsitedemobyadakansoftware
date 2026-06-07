"use server";

import { OrderStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-response";
import { requireAdminPermission, adminPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";
import { productAdminSchema } from "@/lib/validators";

type ProductVariantInput = {
  name: string;
  value: string;
  sku: string;
  barcode?: string;
  stock: number;
  priceDiff: number;
};

const allowedOrderStatuses = new Set<string>(Object.values(OrderStatus));
const allowedPaymentStatuses = new Set<string>(Object.values(PaymentStatus));

function buildProductData(formData: FormData) {
  const parsed = productAdminSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on"
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Urun verisi hatali");
  }

  const imageUrls = formData
    .getAll("imageUrls")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const variantNames = formData.getAll("variantNames").map((value) => String(value).trim());
  const variantValues = formData.getAll("variantValues").map((value) => String(value).trim());
  const variantSkus = formData.getAll("variantSkus").map((value) => String(value).trim());
  const variantBarcodes = formData.getAll("variantBarcodes").map((value) => String(value).trim());
  const variantStocks = formData.getAll("variantStocks").map((value) => String(value).trim());
  const variantPriceDiffs = formData.getAll("variantPriceDiffs").map((value) => String(value).trim());

  const variants: ProductVariantInput[] = [];
  const variantRowCount = Math.max(
    variantNames.length,
    variantValues.length,
    variantSkus.length,
    variantBarcodes.length,
    variantStocks.length,
    variantPriceDiffs.length
  );

  for (let index = 0; index < variantRowCount; index += 1) {
    const name = variantNames[index] ?? "";
    const value = variantValues[index] ?? "";
    const sku = variantSkus[index] ?? "";
    const barcode = variantBarcodes[index] ?? "";
    const stockRaw = variantStocks[index] ?? "";
    const priceDiffRaw = variantPriceDiffs[index] ?? "";

    if (![name, value, sku, barcode, stockRaw, priceDiffRaw].some(Boolean)) {
      continue;
    }

    if (!name || !value || !sku || stockRaw === "") {
      throw new Error(`Varyant ${index + 1} icin ad, deger, SKU ve stok zorunlu`);
    }

    const stock = Number(stockRaw);
    const priceDiff = priceDiffRaw === "" ? 0 : Number(priceDiffRaw);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(`Varyant ${index + 1} stogu gecersiz`);
    }
    if (Number.isNaN(priceDiff)) {
      throw new Error(`Varyant ${index + 1} fiyat farki gecersiz`);
    }

    variants.push({
      name,
      value,
      sku,
      barcode: barcode || undefined,
      stock,
      priceDiff
    });
  }

  const { imageUrl: _legacyImageUrl, ...productData } = parsed.data;
  return { imageUrls, variants, productData };
}

export async function updateOrderStatusAction(formData: FormData) {
  await assertTrustedMutation("admin:legacy-order-update");
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");

  if (!orderId) throw new Error("Siparis bulunamadi");
  if (!allowedOrderStatuses.has(status)) throw new Error("Gecersiz siparis durumu");
  if (paymentStatus && !allowedPaymentStatuses.has(paymentStatus)) {
    throw new Error("Gecersiz odeme durumu");
  }

  const admin = await requireAdminPermission(adminPermissions.ordersWrite);
  await enforceRateLimit({
    scope: "admin:legacy-order-update",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla siparis guncellemesi yapildi. Lutfen biraz sonra tekrar deneyin."
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus, adminNote: adminNote || null }
    });

    if (paymentStatus) {
      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: paymentStatus as PaymentStatus,
          confirmedAt: paymentStatus === "CONFIRMED" ? new Date() : null
        }
      });
    }
  });

  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "ORDER",
    entityId: orderId,
    summary: "Legacy siparis durumu guncellendi",
    metadata: { status, paymentStatus: paymentStatus || null }
  }, { adminUserId: admin.id });

  revalidatePath("/admin/orders");
}

export async function createProductAction(formData: FormData) {
  await assertTrustedMutation("admin:legacy-product-create");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:legacy-product-create",
    key: admin.id,
    limit: 20,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla urun islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const { imageUrls, variants, productData } = buildProductData(formData);

  const product = await prisma.product.create({
    data: {
      ...productData,
      images: imageUrls.length > 0
        ? {
            create: imageUrls.map((url, index) => ({
              url,
              alt: productData.name,
              sortOrder: index
            }))
          }
        : undefined,
      variants: variants.length > 0
        ? {
            create: variants
          }
        : undefined
    }
  });

  await createAdminAuditLog({
    action: "CREATE",
    entityType: "PRODUCT",
    entityId: product.id,
    summary: `Legacy urun olusturuldu: ${product.name}`,
    metadata: { slug: product.slug, sku: product.sku, isActive: product.isActive }
  }, { adminUserId: admin.id });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function updateProductAction(formData: FormData) {
  await assertTrustedMutation("admin:legacy-product-update");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:legacy-product-update",
    key: admin.id,
    limit: 30,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla urun islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const productId = String(formData.get("productId") ?? "");
  if (!productId) throw new Error("Urun bulunamadi");

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true }
  });
  if (!existing) throw new Error("Urun bulunamadi");

  const { imageUrls, variants, productData } = buildProductData(formData);

  const previousSlug = existing.slug;
  await prisma.product.update({
    where: { id: productId },
    data: productData
  });

  await prisma.productImage.deleteMany({ where: { productId } });
  if (imageUrls.length > 0) {
    await prisma.productImage.createMany({
      data: imageUrls.map((url, index) => ({
        productId,
        url,
        alt: productData.name,
        sortOrder: index
      }))
    });
  }

  await prisma.productVariant.deleteMany({ where: { productId } });
  if (variants.length > 0) {
    await prisma.productVariant.createMany({
      data: variants.map((variant) => ({
        productId,
        ...variant
      }))
    });
  }

  await createAdminAuditLog({
    action: "UPDATE",
    entityType: "PRODUCT",
    entityId: productId,
    summary: `Legacy urun guncellendi: ${productData.name}`,
    metadata: { slug: productData.slug, previousSlug, sku: productData.sku, isActive: productData.isActive }
  }, { adminUserId: admin.id });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${productData.slug}`);
}

export async function deleteProductAction(formData: FormData) {
  await assertTrustedMutation("admin:legacy-product-delete");
  const admin = await requireAdminPermission(adminPermissions.catalogWrite);
  await enforceRateLimit({
    scope: "admin:legacy-product-delete",
    key: admin.id,
    limit: 15,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla urun silme islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });
  const productId = String(formData.get("productId") ?? "");
  if (!productId) throw new Error("Urun bulunamadi");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  await prisma.product.delete({ where: { id: productId } });

  await createAdminAuditLog({
    action: "DELETE",
    entityType: "PRODUCT",
    entityId: productId,
    summary: `Legacy urun silindi: ${product?.name ?? productId}`,
    metadata: { slug: product?.slug ?? null, sku: product?.sku ?? null }
  }, { adminUserId: admin.id });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function createProductFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await createProductAction(formData);
    return actionSuccess(undefined, "Urun olusturuldu.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Urun olusturulamadi.");
  }
}

export async function updateProductFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateProductAction(formData);
    return actionSuccess(undefined, "Urun guncellendi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Urun guncellenemedi.");
  }
}

export async function deleteProductFormAction(
  _state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await deleteProductAction(formData);
    return actionSuccess(undefined, "Urun silindi.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Urun silinemedi.");
  }
}
