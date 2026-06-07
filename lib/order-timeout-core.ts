export type WaitingPaymentTimeoutInput = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string | null;
  createdAt: Date;
  inventoryRestoredAt: Date | null;
};

export function detectTimedOutWaitingPaymentOrders(
  orders: WaitingPaymentTimeoutInput[],
  timeoutHours: number,
  now = new Date()
) {
  const timeoutCutoff = now.getTime() - timeoutHours * 60 * 60 * 1000;

  return orders.filter((order) => {
    if (order.status !== "WAITING_PAYMENT") return false;
    if (order.paymentMethod !== "BANK_TRANSFER") return false;
    if (order.paymentStatus && order.paymentStatus !== "WAITING") return false;
    if (order.inventoryRestoredAt) return false;

    return order.createdAt.getTime() < timeoutCutoff;
  });
}
