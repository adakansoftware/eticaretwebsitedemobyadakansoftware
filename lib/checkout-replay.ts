import { createHash } from "node:crypto";

type CheckoutReplayInput = {
  cartId: string;
  userId?: string | null;
  addressId?: string | null;
  guestEmail?: string | null;
  paymentMethod: string;
  couponCode?: string | null;
  customerNote?: string | null;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    updatedAt: Date;
  }>;
};

export function buildCheckoutReplayKey(input: CheckoutReplayInput) {
  const normalized = {
    cartId: input.cartId,
    userId: input.userId ?? null,
    addressId: input.addressId ?? null,
    guestEmail: input.guestEmail?.trim().toLowerCase() ?? null,
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode?.trim().toUpperCase() ?? null,
    customerNote: input.customerNote?.trim() ?? null,
    items: [...input.items]
      .sort((a, b) =>
        `${a.productId}:${a.variantId ?? ""}`.localeCompare(`${b.productId}:${b.variantId ?? ""}`)
      )
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        updatedAt: item.updatedAt.toISOString()
      }))
  };

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
