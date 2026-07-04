export type SupportedPaymentMethod = "BANK_TRANSFER" | "CASH_ON_DELIVERY";
export type SupportedOrderStatus =
  | "PENDING"
  | "WAITING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";
export type SupportedPaymentStatus = "WAITING" | "CONFIRMED" | "REJECTED" | "REFUNDED";

export function buildInitialOrderStatus(paymentMethod: SupportedPaymentMethod): SupportedOrderStatus {
  return paymentMethod === "BANK_TRANSFER" ? "WAITING_PAYMENT" : "PENDING";
}

export function buildInitialPaymentStatus(): SupportedPaymentStatus {
  return "WAITING";
}

export function buildOrderStatusAfterManualPaymentConfirmation(
  currentStatus: SupportedOrderStatus
): SupportedOrderStatus {
  return currentStatus === "WAITING_PAYMENT" || currentStatus === "PENDING"
    ? "PAID"
    : currentStatus;
}

export function paymentMethodRequiresManualConfirmation(paymentMethod: SupportedPaymentMethod) {
  return paymentMethod === "BANK_TRANSFER";
}
