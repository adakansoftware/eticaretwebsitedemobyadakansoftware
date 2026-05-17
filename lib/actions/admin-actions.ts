"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productAdminSchema } from "@/lib/validators";

function buildProductData(formData: FormData) {
  const parsed = productAdminSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on"
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Urun verisi hatali");
  }

  const { imageUrl, ...productData } = parsed.data;
  return { imageUrl, productData };
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");

  const allowedStatuses = [
    "PENDING",
    "WAITING_PAYMENT",
    "PAID",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED"
  ];

  if (!orderId) throw new Error("Siparis bulunamadi");
  if (!allowedStatuses.includes(status)) throw new Error("Gecersiz siparis durumu");

  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: status as any, adminNote: adminNote || null }
    });

    if (paymentStatus) {
      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: paymentStatus as any,
          confirmedAt: paymentStatus === "CONFIRMED" ? new Date() : null
        }
      });
    }
  });

  revalidatePath("/admin/orders");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const { imageUrl, productData } = buildProductData(formData);

  await prisma.product.create({
    data: {
      ...productData,
      images: imageUrl
        ? {
            create: {
              url: imageUrl,
              alt: productData.name,
              sortOrder: 0
            }
          }
        : undefined
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) throw new Error("Urun bulunamadi");

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
  });
  if (!existing) throw new Error("Urun bulunamadi");

  const { imageUrl, productData } = buildProductData(formData);

  await prisma.product.update({
    where: { id: productId },
    data: productData
  });

  const firstImage = existing.images[0];
  if (imageUrl && firstImage) {
    await prisma.productImage.update({
      where: { id: firstImage.id },
      data: { url: imageUrl, alt: productData.name }
    });
  } else if (imageUrl && !firstImage) {
    await prisma.productImage.create({
      data: {
        productId,
        url: imageUrl,
        alt: productData.name,
        sortOrder: 0
      }
    });
  } else if (!imageUrl && firstImage) {
    await prisma.productImage.delete({ where: { id: firstImage.id } });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${productData.slug}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) throw new Error("Urun bulunamadi");

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}
