"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";

async function unsetDefaultAddress(userId: string, excludeId?: string) {
  await prisma.address.updateMany({
    where: { userId, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    data: { isDefault: false }
  });
}

export async function createAddressAction(formData: FormData) {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Adres bilgisi gecersiz");
  }

  const addressCount = await prisma.address.count({ where: { userId: user.id } });
  const makeDefault = parsed.data.isDefault || addressCount === 0;

  if (makeDefault) {
    await unsetDefaultAddress(user.id);
  }

  await prisma.address.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      district: parsed.data.district,
      address: parsed.data.address,
      postalCode: parsed.data.postalCode || null,
      isDefault: makeDefault
    }
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function updateAddressAction(formData: FormData) {
  const user = await requireUser();
  const addressId = String(formData.get("addressId") ?? "");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!addressId) throw new Error("Adres bulunamadi");
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Adres bilgisi gecersiz");
  }

  const existing = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!existing) throw new Error("Adres bulunamadi");

  if (parsed.data.isDefault) {
    await unsetDefaultAddress(user.id, existing.id);
  }

  await prisma.address.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      district: parsed.data.district,
      address: parsed.data.address,
      postalCode: parsed.data.postalCode || null,
      isDefault: parsed.data.isDefault
    }
  });

  const remainingDefault = await prisma.address.findFirst({
    where: { userId: user.id, isDefault: true }
  });
  if (!remainingDefault) {
    await prisma.address.update({ where: { id: existing.id }, data: { isDefault: true } });
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) throw new Error("Adres bulunamadi");

  const existing = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!existing) throw new Error("Adres bulunamadi");

  await prisma.address.delete({ where: { id: existing.id } });

  if (existing.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }
    });
    if (nextAddress) {
      await prisma.address.update({ where: { id: nextAddress.id }, data: { isDefault: true } });
    }
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
