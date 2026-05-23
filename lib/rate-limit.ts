import { cookies, headers } from "next/headers";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
  message: string;
};

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function getRequestFingerprint() {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  const userAgent = headerStore.get("user-agent")?.trim() ?? "unknown-agent";
  const cartId = cookieStore.get("adakan_cart")?.value ?? "no-cart";

  return hashKey([forwardedFor ?? realIp ?? "unknown-ip", userAgent, cartId].join("|"));
}

export async function enforceRateLimit({
  scope,
  key,
  limit,
  windowMs,
  message
}: RateLimitOptions) {
  const now = new Date();
  const hashedKey = hashKey(key);
  const existing = await prisma.actionRateLimit.findUnique({
    where: {
      scope_key: {
        scope,
        key: hashedKey
      }
    }
  });

  if (!existing || existing.expiresAt <= now) {
    await prisma.actionRateLimit.upsert({
      where: {
        scope_key: {
          scope,
          key: hashedKey
        }
      },
      update: {
        count: 1,
        expiresAt: new Date(now.getTime() + windowMs),
        blockedCount: 0,
        lastBlockedAt: null
      },
      create: {
        scope,
        key: hashedKey,
        count: 1,
        expiresAt: new Date(now.getTime() + windowMs)
      }
    });
    return;
  }

  if (existing.count >= limit) {
    await prisma.actionRateLimit.update({
      where: { id: existing.id },
      data: {
        blockedCount: { increment: 1 },
        lastBlockedAt: now
      }
    });
    throw new Error(message);
  }

  await prisma.actionRateLimit.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } }
  });
}
