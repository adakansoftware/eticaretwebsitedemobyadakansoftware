import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { adminPermissions, requireAdminPermission } from "@/lib/auth";
import { toCsvContent } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(adminPermissions.customersRead);
  } catch {
    return NextResponse.json({ message: "Yetkisiz erisim" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role")?.trim();
  const dateFrom = searchParams.get("dateFrom")?.trim();
  const dateTo = searchParams.get("dateTo")?.trim();
  const roleFilter: "ADMIN" | "USER" | undefined =
    role === "ADMIN" || role === "USER" ? role : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...((dateFrom || dateTo)
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {})
          }
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const users = await prisma.user.findMany({
    where,
    include: {
      _count: { select: { orders: true, addresses: true, wishlistItems: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const csv = toCsvContent(
    [
      "ID",
      "Ad Soyad",
      "E-posta",
      "Rol",
      "Telefon",
      "Siparis Sayisi",
      "Adres Sayisi",
      "Wishlist Sayisi",
      "Kayit Tarihi"
    ],
    users.map((user) => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone,
      user._count.orders,
      user._count.addresses,
      user._count.wishlistItems,
      user.createdAt.toISOString()
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-customers-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
