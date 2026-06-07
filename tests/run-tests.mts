import assert from "node:assert/strict";
import { actionError, actionSuccess } from "../lib/action-response.ts";
import { buildCheckoutReplayKey } from "../lib/checkout-replay.ts";
import { toCsvContent, toCsvRow } from "../lib/csv.ts";
import { getEnvHealthIndicatorsFromConfig, summarizeHealth } from "../lib/health-core.ts";
import { formatMoney } from "../lib/money.ts";
import { buildTrustedOrigins, isTrustedOriginRequest, parseTrustedOrigins } from "../lib/origin.ts";
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
