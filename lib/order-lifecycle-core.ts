export type OrderLifecycleStatus =
  | "PENDING"
  | "WAITING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

const blockedRollbackStatuses = new Set<OrderLifecycleStatus>(["CANCELLED", "REFUNDED"]);
const inventoryRollbackStatuses = new Set<OrderLifecycleStatus>(["CANCELLED", "REFUNDED"]);

function shouldRequireTrackingDetails(
  status: OrderLifecycleStatus,
  trackingNumber?: string | null,
  trackingCarrier?: string | null
) {
  if (status !== "SHIPPED" && status !== "DELIVERED") {
    return false;
  }

  return !(trackingNumber?.trim() && trackingCarrier?.trim());
}

export function ensureOrderStatusTransition(
  currentStatus: OrderLifecycleStatus,
  nextStatus: OrderLifecycleStatus
) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (blockedRollbackStatuses.has(currentStatus)) {
    throw new Error("Iptal veya iade edilmis siparis farkli bir duruma geri alinamaz");
  }

  if (currentStatus === "DELIVERED" && nextStatus !== "REFUNDED") {
    throw new Error("Teslim edilen siparis yalnizca iade akisina alinabilir");
  }
}

export function shouldRestoreInventoryForStatusChange(
  currentStatus: OrderLifecycleStatus,
  nextStatus: OrderLifecycleStatus,
  inventoryRestoredAt: Date | null
) {
  return (
    currentStatus !== nextStatus &&
    inventoryRollbackStatuses.has(nextStatus) &&
    !inventoryRestoredAt
  );
}

export function shouldQueueOrderStatusNotification(input: {
  previousStatus: OrderLifecycleStatus;
  nextStatus: OrderLifecycleStatus;
  previousTrackingNumber?: string | null;
  previousTrackingCarrier?: string | null;
  nextTrackingNumber?: string | null;
  nextTrackingCarrier?: string | null;
  recipientEmail?: string | null;
}) {
  if (!input.recipientEmail) {
    return false;
  }

  return (
    input.previousStatus !== input.nextStatus ||
    (input.previousTrackingNumber ?? null) !== (input.nextTrackingNumber ?? null) ||
    (input.previousTrackingCarrier ?? null) !== (input.nextTrackingCarrier ?? null)
  );
}

export function validateShippingTransition(input: {
  status: OrderLifecycleStatus;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
}) {
  if (shouldRequireTrackingDetails(input.status, input.trackingNumber, input.trackingCarrier)) {
    throw new Error("Kargoya verilen veya teslim edilen siparislerde takip numarasi ve kargo firmasi zorunludur");
  }
}
