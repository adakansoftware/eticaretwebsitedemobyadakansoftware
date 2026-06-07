import { NextResponse } from "next/server";
import { adminPermissions, requireAdminPermission } from "@/lib/auth";
import { toCsvContent } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(adminPermissions.catalogWrite);
  } catch {
    return NextResponse.json({ message: "Yetkisiz erisim" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const brand = searchParams.get("brand")?.trim();
  const status = searchParams.get("status")?.trim();
  const stock = searchParams.get("stock")?.trim();

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(category ? { categoryId: category } : {}),
      ...(brand ? { brandId: brand } : {}),
      ...(status === "active"
        ? { isActive: true }
        : status === "passive"
          ? { isActive: false }
          : {}),
      ...(stock === "in-stock" ? { stock: { gt: 0 } } : stock === "low-stock" ? { stock: { lte: 5 } } : {})
    },
    include: {
      category: true,
      brand: true,
      variants: true,
      images: true
    },
    orderBy: { createdAt: "desc" }
  });

  const csv = toCsvContent(
    [
      "Urun",
      "Slug",
      "SKU",
      "Kategori",
      "Marka",
      "Durum",
      "One Cikan",
      "Liste Fiyati",
      "Satis Fiyati",
      "Stok",
      "Dusuk Stok Esigi",
      "Gorsel Sayisi",
      "Varyant Sayisi",
      "Olusturma Tarihi"
    ],
    products.map((product) => [
      product.name,
      product.slug,
      product.sku,
      product.category.name,
      product.brand?.name ?? "",
      product.isActive ? "Aktif" : "Pasif",
      product.isFeatured ? "Evet" : "Hayir",
      product.price.toString(),
      product.salePrice?.toString() ?? "",
      product.stock,
      product.lowStockThreshold,
      product.images.length,
      product.variants.length,
      product.createdAt.toISOString()
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-products-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
