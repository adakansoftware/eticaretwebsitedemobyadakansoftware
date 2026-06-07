import "./load-env.mts";
import { env } from "../lib/env.ts";
import { detectOrderAnomalies } from "../lib/order-anomalies-core.ts";
import { prisma } from "../lib/prisma.ts";

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      payment: {
        select: {
          status: true
        }
      }
    }
  });

  const anomalies = detectOrderAnomalies(
    orders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      inventoryRestoredAt: order.inventoryRestoredAt
    })),
    {
      stuckOrderMinutes: env.OPS_STUCK_ORDER_MINUTES
    }
  ).map((anomaly) => {
    const matchingOrder = orders.find((order) => order.id === anomaly.orderId);
    const ageMinutes = matchingOrder
      ? Math.max(
          0,
          Math.round((Date.now() - matchingOrder.createdAt.getTime()) / (60 * 1000))
        )
      : null;

    return {
      ...anomaly,
      status: matchingOrder?.status ?? null,
      paymentStatus: matchingOrder?.payment?.status ?? null,
      paymentMethod: matchingOrder?.paymentMethod ?? null,
      trackingNumber: matchingOrder?.trackingNumber ?? null,
      trackingCarrier: matchingOrder?.trackingCarrier ?? null,
      ageMinutes
    };
  });

  const reasons = Object.entries(
    anomalies.reduce<Record<string, number>>((acc, anomaly) => {
      for (const reason of anomaly.reasons) {
        acc[reason] = (acc[reason] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({ reason, count }));

  console.log(
    JSON.stringify(
      {
        observedAt: new Date().toISOString(),
        thresholds: {
          stuckOrderMinutes: env.OPS_STUCK_ORDER_MINUTES
        },
        totalOrdersScanned: orders.length,
        anomalyCount: anomalies.length,
        reasons,
        latestAnomalies: anomalies.slice(0, 25)
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Order anomaly review failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
