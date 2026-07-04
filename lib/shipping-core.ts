export type SupportedTrackingCarrier = "ARAS" | "MNG" | "YURTICI" | "PTT" | "SURAT" | "DIGER";
export type ShippingAwareOrderStatus =
  | "PENDING"
  | "WAITING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export function shouldRequireTrackingDetails(
  status: ShippingAwareOrderStatus,
  trackingNumber?: string | null,
  trackingCarrier?: string | null
) {
  if (status !== "SHIPPED" && status !== "DELIVERED") {
    return false;
  }

  return !(trackingNumber?.trim() && trackingCarrier?.trim());
}
