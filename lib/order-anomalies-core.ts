export type OrderAnomalyInput = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string | null;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  inventoryRestoredAt: Date | null;
};

export type OrderAnomaly = {
  orderId: string;
  orderNumber: string;
  reasons: string[];
};

type Thresholds = {
  stuckOrderMinutes: number;
  waitingPaymentTimeoutHours: number;
};

function isSyntheticSeedOrder(orderNumber: string) {
  return orderNumber.startsWith("ADK-SEED-");
}

export function detectOrderAnomalies(
  orders: OrderAnomalyInput[],
  thresholds: Thresholds,
  now = new Date()
) {
  const stuckCutoff = now.getTime() - thresholds.stuckOrderMinutes * 60 * 1000;
  const waitingPaymentTimeoutCutoff =
    now.getTime() - thresholds.waitingPaymentTimeoutHours * 60 * 60 * 1000;
  const anomalies: OrderAnomaly[] = [];

  for (const order of orders) {
    const reasons: string[] = [];

    const isWaitingBankTransfer =
      order.status === "WAITING_PAYMENT" && order.paymentMethod === "BANK_TRANSFER";
    const isGeneralStuckOrder =
      ["PENDING", "PAID", "PREPARING"].includes(order.status) &&
      order.createdAt.getTime() < stuckCutoff;
    const isTimedOutWaitingPayment =
      isWaitingBankTransfer && order.createdAt.getTime() < waitingPaymentTimeoutCutoff;

    if (isGeneralStuckOrder || isTimedOutWaitingPayment) {
      reasons.push("stuck_fulfillment_or_payment");
    }

    if (
      order.status === "WAITING_PAYMENT" &&
      order.paymentMethod === "BANK_TRANSFER" &&
      order.paymentStatus === "CONFIRMED"
    ) {
      reasons.push("payment_confirmed_but_order_not_progressed");
    }

    if (
      ["SHIPPED", "DELIVERED"].includes(order.status) &&
      !isSyntheticSeedOrder(order.orderNumber) &&
      (!order.trackingNumber || !order.trackingCarrier)
    ) {
      reasons.push("shipping_status_missing_tracking");
    }

    if (
      ["CANCELLED", "REFUNDED"].includes(order.status) &&
      !order.inventoryRestoredAt
    ) {
      reasons.push("cancelled_or_refunded_without_inventory_restore_marker");
    }

    if (order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === null) {
      reasons.push("missing_payment_record");
    }

    if (reasons.length > 0) {
      anomalies.push({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        reasons
      });
    }
  }

  return anomalies;
}
