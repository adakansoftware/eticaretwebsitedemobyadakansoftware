import assert from "node:assert/strict";
import { actionError, actionSuccess } from "../lib/action-response.ts";
import { buildCheckoutReplayKey } from "../lib/checkout-replay.ts";
import { toCsvContent, toCsvRow } from "../lib/csv.ts";
import { getEnvHealthIndicatorsFromConfig, summarizeHealth } from "../lib/health-core.ts";
import { formatMoney } from "../lib/money.ts";
import { buildTrustedOrigins, isTrustedOriginRequest, parseTrustedOrigins } from "../lib/origin.ts";
import { detectOrderAnomalies } from "../lib/order-anomalies-core.ts";
import { detectTimedOutWaitingPaymentOrders } from "../lib/order-timeout-core.ts";
import { summarizeOpsStatus } from "../lib/ops-core.ts";
import { createSlug } from "../lib/slug.ts";

async function main() {
  const checks: Array<{ name: string; run: () => void | Promise<void> }> = [
    {
      name: "actionSuccess returns success payload",
      run: () => {
        const result = actionSuccess({ id: "1" }, "Tamam");
        assert.equal(result.success, true);
        assert.equal(result.message, "Tamam");
        if (result.success) {
          assert.deepEqual(result.data, { id: "1" });
        }
      }
    },
    {
      name: "actionError returns field errors",
      run: () => {
        const result = actionError("Hatali", { email: ["Gecersiz"] });
        assert.equal(result.success, false);
        assert.equal(result.message, "Hatali");
        if (!result.success) {
          assert.deepEqual(result.fieldErrors, { email: ["Gecersiz"] });
        }
      }
    },
    {
      name: "CSV row escapes quotes and commas",
      run: () => {
        const row = toCsvRow(['A "quote"', "B,comma", 42, null]);
        assert.equal(row, "\"A \"\"quote\"\"\",\"B,comma\",\"42\",\"\"");
      }
    },
    {
      name: "CSV content builds header and body",
      run: () => {
        const csv = toCsvContent(["Ad", "Tutar"], [["Kalem", 99]]);
        assert.equal(csv, "\"Ad\",\"Tutar\"\n\"Kalem\",\"99\"");
      }
    },
    {
      name: "slugify normalizes Turkish characters",
      run: () => {
        assert.equal(createSlug("Çılgın Öğüş Şehir"), "cilgin-ogus-sehir");
      }
    },
    {
      name: "formatMoney returns TRY output",
      run: () => {
        const formatted = formatMoney(1499);
        assert.match(formatted, /₺|TRY/);
        assert.match(formatted, /1\.499|1,499|1499/);
      }
    },
    {
      name: "trusted origin parser deduplicates values",
      run: () => {
        assert.deepEqual(parseTrustedOrigins("http://localhost:3000, http://localhost:3000"), [
          "http://localhost:3000"
        ]);
      }
    },
    {
      name: "trusted request accepts same-site origin",
      run: () => {
        assert.equal(
          isTrustedOriginRequest({
            siteUrl: "http://localhost:3000",
            configuredOrigins: buildTrustedOrigins("http://localhost:3000"),
            origin: "http://localhost:3000",
            host: "localhost:3000"
          }),
          true
        );
      }
    },
    {
      name: "checkout replay key is stable for equal payloads",
      run: () => {
        const first = buildCheckoutReplayKey({
          cartId: "cart-1",
          userId: "user-1",
          paymentMethod: "BANK_TRANSFER",
          items: [
            {
              productId: "product-2",
              variantId: null,
              quantity: 1,
              updatedAt: new Date("2026-06-06T09:00:00.000Z")
            },
            {
              productId: "product-1",
              variantId: "variant-1",
              quantity: 2,
              updatedAt: new Date("2026-06-06T10:00:00.000Z")
            }
          ]
        });

        const second = buildCheckoutReplayKey({
          cartId: "cart-1",
          userId: "user-1",
          paymentMethod: "BANK_TRANSFER",
          items: [
            {
              productId: "product-1",
              variantId: "variant-1",
              quantity: 2,
              updatedAt: new Date("2026-06-06T10:00:00.000Z")
            },
            {
              productId: "product-2",
              variantId: null,
              quantity: 1,
              updatedAt: new Date("2026-06-06T09:00:00.000Z")
            }
          ]
        });

        assert.equal(first, second);
      }
    },
    {
      name: "health summary fails when any indicator is false",
      run: () => {
        const summary = summarizeHealth([
          { name: "database", ok: true },
          { name: "env", ok: false, detail: "missing" }
        ]);

        assert.equal(summary.ok, false);
        assert.equal(summary.indicators.length, 2);
      }
    },
    {
      name: "env health indicators expose auth and smtp checks",
      run: () => {
        const indicators = getEnvHealthIndicatorsFromConfig({
          authSecret: "a".repeat(32),
          siteUrl: "http://localhost:3000",
          smtpHost: "smtp.example.com",
          smtpUser: "mailer",
          smtpPass: "secret",
          smtpFrom: "noreply@example.com",
          nodeEnv: "development"
        });
        assert.equal(indicators.some((indicator) => indicator.name === "auth_secret"), true);
        assert.equal(indicators.some((indicator) => indicator.name === "smtp"), true);
      }
    },
    {
      name: "ops status summary warns for low stock and stuck orders",
      run: () => {
        const summary = summarizeOpsStatus({
          lowStockProducts: 2,
          stuckOrders: 1,
          recentRateLimitBlocks: 3,
          rateLimitAlertThreshold: 2,
          expiredPasswordResetTokens: 0,
          staleReplayGuards: 0,
          missingSiteSettings: false,
          missingAdminUsers: false
        });

        assert.equal(summary.ok, false);
        assert.equal(summary.signals.find((signal) => signal.name === "low_stock")?.ok, false);
        assert.equal(summary.signals.find((signal) => signal.name === "stuck_orders")?.ok, false);
        assert.equal(summary.signals.find((signal) => signal.name === "rate_limit_blocks")?.ok, false);
      }
    },
    {
      name: "order anomaly detector flags stuck and missing tracking orders",
      run: () => {
        const anomalies = detectOrderAnomalies(
          [
            {
              orderId: "order-1",
              orderNumber: "ADK-1",
              status: "WAITING_PAYMENT",
              paymentStatus: "CONFIRMED",
              paymentMethod: "BANK_TRANSFER",
              createdAt: new Date("2026-06-07T08:00:00.000Z"),
              updatedAt: new Date("2026-06-07T08:30:00.000Z"),
              trackingNumber: null,
              trackingCarrier: null,
              inventoryRestoredAt: null
            },
            {
              orderId: "order-2",
              orderNumber: "ADK-2",
              status: "SHIPPED",
              paymentStatus: "CONFIRMED",
              paymentMethod: "CASH_ON_DELIVERY",
              createdAt: new Date("2026-06-07T10:00:00.000Z"),
              updatedAt: new Date("2026-06-07T10:15:00.000Z"),
              trackingNumber: null,
              trackingCarrier: "Yurtici",
              inventoryRestoredAt: null
            },
            {
              orderId: "order-3",
              orderNumber: "ADK-SEED-1001",
              status: "DELIVERED",
              paymentStatus: "CONFIRMED",
              paymentMethod: "BANK_TRANSFER",
              createdAt: new Date("2026-06-07T09:00:00.000Z"),
              updatedAt: new Date("2026-06-07T09:30:00.000Z"),
              trackingNumber: null,
              trackingCarrier: null,
              inventoryRestoredAt: null
            }
          ],
          { stuckOrderMinutes: 120, waitingPaymentTimeoutHours: 24 },
          new Date("2026-06-07T12:30:00.000Z")
        );

        assert.equal(anomalies.length, 2);
        assert.equal(anomalies[0]?.reasons.includes("stuck_fulfillment_or_payment"), false);
        assert.equal(
          anomalies[0]?.reasons.includes("payment_confirmed_but_order_not_progressed"),
          true
        );
        assert.equal(
          anomalies[1]?.reasons.includes("shipping_status_missing_tracking"),
          true
        );
        assert.equal(anomalies.some((anomaly) => anomaly.orderNumber === "ADK-SEED-1001"), false);
      }
    },
    {
      name: "waiting payment timeout detector finds only overdue bank transfer orders",
      run: () => {
        const timedOutOrders = detectTimedOutWaitingPaymentOrders(
          [
            {
              orderId: "order-1",
              orderNumber: "ADK-1",
              status: "WAITING_PAYMENT",
              paymentMethod: "BANK_TRANSFER",
              paymentStatus: "WAITING",
              createdAt: new Date("2026-06-06T08:00:00.000Z"),
              inventoryRestoredAt: null
            },
            {
              orderId: "order-2",
              orderNumber: "ADK-2",
              status: "WAITING_PAYMENT",
              paymentMethod: "CASH_ON_DELIVERY",
              paymentStatus: "WAITING",
              createdAt: new Date("2026-06-06T08:00:00.000Z"),
              inventoryRestoredAt: null
            },
            {
              orderId: "order-3",
              orderNumber: "ADK-3",
              status: "WAITING_PAYMENT",
              paymentMethod: "BANK_TRANSFER",
              paymentStatus: "CONFIRMED",
              createdAt: new Date("2026-06-06T08:00:00.000Z"),
              inventoryRestoredAt: null
            }
          ],
          24,
          new Date("2026-06-07T12:30:00.000Z")
        );

        assert.equal(timedOutOrders.length, 1);
        assert.equal(timedOutOrders[0]?.orderId, "order-1");
      }
    }
  ];

  for (const check of checks) {
    await check.run();
    console.log(`PASS ${check.name}`);
  }

  console.log(`All ${checks.length} checks passed.`);
}

main().catch((error) => {
  console.error("Test run failed.");
  console.error(error);
  process.exit(1);
});
