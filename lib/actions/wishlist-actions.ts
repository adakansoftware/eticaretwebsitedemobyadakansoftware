"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getRequestFingerprint } from "@/lib/rate-limit";
import { assertTrustedMutation } from "@/lib/security";

function revalidateWishlistPaths(productSlug?: string) {
  revalidatePath("/account/wishlist");
  revalidatePath("/products");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
}

export async function toggleWishlistAction(productId: string, productSlug?: string) {
  const user = await requireUser();
  await assertTrustedMutation("account:wishlist-toggle");
  const fingerprint = await getRequestFingerprint();
  await enforceRateLimit({
    scope: "account:wishlist-toggle",
    key: `${user.id}|${fingerprint}`,
    limit: 40,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla favori islemi yapildi. Lutfen biraz sonra tekrar deneyin."
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId
      }
    }
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId
      }
    });
  }

  revalidateWishlistPaths(productSlug);
  return { added: !existing };
}

export async function removeWishlistItemAction(itemId: string, productSlug?: string) {
  const user = await requireUser();
  await assertTrustedMutation("account:wishlist-remove");
  const fingerprint = await getRequestFingerprint();
  await enforceRateLimit({
    scope: "account:wishlist-remove",
    key: `${user.id}|${fingerprint}`,
    limit: 25,
    windowMs: 10 * 60 * 1000,
    message: "Cok fazla favori kaldirma denemesi yapildi. Lutfen biraz sonra tekrar deneyin."
  });

  const existing = await prisma.wishlistItem.findFirst({
    where: {
      id: itemId,
      userId: user.id
    }
  });

  if (!existing) throw new Error("Wishlist urunu bulunamadi");

  await prisma.wishlistItem.delete({ where: { id: itemId } });
  revalidateWishlistPaths(productSlug);
}
