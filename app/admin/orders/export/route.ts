import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { toCsvContent } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkisiz erisim" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const paymentStatus = searchParams.get("paymentStatus")?.trim();
  const paymentMethod = searchParams.get("paymentMethod")?.trim();
  const dateFrom = searchParams.get("dateFrom")?.trim();
  const dateTo = searchParams.get("dateTo")?.trim();
  const paymentStatusFilter = Object.values(PaymentStatus).find((item) => item === paymentStatus);
  const paymentMethodFilter = Object.values(PaymentMethod).find((item) => item === paymentMethod);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as Prisma.OrderWhereInput["status"] } : {}),
    ...(paymentStatusFilter ? { payment: { is: { status: paymentStatusFilter } } } : {}),
    ...(paymentMethodFilter ? { paymentMethod: paymentMethodFilter } : {}),
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
            { orderNumber: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { shippingCity: { contains: q, mode: "insensitive" } },
            { shippingDistrict: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const orders = await prisma.order.findMany({
    where,
    include: { user: true, payment: true, items: true },
    orderBy: { createdAt: "desc" }
  });

  const csv = toCsvContent(
    [
      "Siparis No",
      "Musteri",
      "E-posta",
      "Durum",
      "Odeme Durumu",
      "Odeme Yontemi",
      "Sehir",
      "Ilce",
      "Urun Adedi",
      "Ara Toplam",
      "Indirim",
      "Kargo",
      "Genel Toplam",
      "Olusturma Tarihi"
    ],
    orders.map((order) => [
      order.orderNumber,
      order.user.name,
      order.user.email,
      order.status,
      order.payment?.status ?? "KAYIT_YOK",
      order.paymentMethod,
      order.shippingCity,
      order.shippingDistrict,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      order.subtotal.toString(),
      order.discountTotal.toString(),
      order.shippingTotal.toString(),
      order.grandTotal.toString(),
      order.createdAt.toISOString()
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-orders-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
