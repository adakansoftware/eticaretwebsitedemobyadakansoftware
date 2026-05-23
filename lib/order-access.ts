import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const orderAccessSecret = new TextEncoder().encode(env.AUTH_SECRET);

type OrderAccessPayload = {
  orderId: string;
  mode: "guest-order-access";
};

export async function createGuestOrderAccessToken(orderId: string) {
  return new SignJWT({ orderId, mode: "guest-order-access" } satisfies OrderAccessPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(orderAccessSecret);
}

export async function verifyGuestOrderAccessToken(token: string, orderId: string) {
  try {
    const { payload } = await jwtVerify(token, orderAccessSecret);
    return payload.mode === "guest-order-access" && payload.orderId === orderId;
  } catch {
    return false;
  }
}
