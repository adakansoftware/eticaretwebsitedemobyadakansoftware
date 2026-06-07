import assert from "node:assert/strict";
import { buildApiHeadersCore } from "../lib/api-response-core.ts";
import { actionError, actionSuccess } from "../lib/action-response.ts";
import { buildCheckoutReplayKey } from "../lib/checkout-replay.ts";
import { toCsvContent, toCsvRow } from "../lib/csv.ts";
import { getEnvHealthIndicatorsFromConfig, summarizeHealth } from "../lib/health-core.ts";
import { HttpError, getHttpErrorStatus } from "../lib/http-error.ts";
import { formatMoney } from "../lib/money.ts";
import { buildTrustedOrigins, isTrustedOriginRequest, parseTrustedOrigins } from "../lib/origin.ts";
import { redactLogValue } from "../lib/log-redaction.ts";
import { detectOrderAnomalies } from "../lib/order-anomalies-core.ts";
import { detectTimedOutWaitingPaymentOrders } from "../lib/order-timeout-core.ts";
import { summarizeOpsStatus } from "../lib/ops-core.ts";
import { buildNextOutboxAvailability } from "../lib/outbox-core.ts";
import { buildAdditionalSecurityHeaders } from "../lib/security-headers.ts";
import { createSlug } from "../lib/slug.ts";
import {
  buildSignedS3PutRequest,
  buildUploadObjectKey,
  resolveS3ObjectTarget,
  sanitizeUploadFolder
} from "../lib/upload-storage-core.ts";
import { MAX_FILE_SIZE, MAX_UPLOAD_REQUEST_SIZE, detectUploadExtension } from "../lib/upload-core.ts";

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
      name: "api headers always include request id and no-store",
      run: () => {
        const headers = buildApiHeadersCore(
          "req-123",
          { "x-extra": "ok" },
          { "x-content-type-options": "nosniff" }
        );
        assert.equal(headers.get("x-request-id"), "req-123");
        assert.equal(headers.get("cache-control"), "no-store");
        assert.equal(headers.get("x-content-type-options"), "nosniff");
        assert.equal(headers.get("x-extra"), "ok");
      }
    },
    {
      name: "http error exposes explicit status",
      run: () => {
        assert.equal(getHttpErrorStatus(new HttpError(429, "Too many")), 429);
        assert.equal(getHttpErrorStatus(new Error("plain"), 418), 418);
      }
    },
    {
      name: "security headers build report-only CSP by default",
      run: () => {
        const headers = buildAdditionalSecurityHeaders({
          nodeEnv: "development",
          siteUrl: "http://localhost:3000",
          cspReportOnly: true
        });
        assert.equal(typeof headers["content-security-policy-report-only"], "string");
        assert.equal(headers["strict-transport-security"], undefined);
      }
    },
    {
      name: "security headers include hsts in production and sentry connect-src",
      run: () => {
        const headers = buildAdditionalSecurityHeaders({
          nodeEnv: "production",
          siteUrl: "https://shop.example.com",
          sentryDsn: "https://abc@example.ingest.sentry.io/123",
          cspReportOnly: false
        });
        assert.equal(headers["strict-transport-security"]?.includes("max-age=31536000"), true);
        assert.equal(headers["content-security-policy"]?.includes("https://example.ingest.sentry.io"), true);
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
      name: "trusted request accepts forwarded host fallback",
      run: () => {
        assert.equal(
          isTrustedOriginRequest({
            siteUrl: "https://shop.example.com",
            configuredOrigins: buildTrustedOrigins("https://shop.example.com"),
            origin: null,
            referer: null,
            host: "shop.example.com",
            forwardedHost: "shop.example.com",
            forwardedProto: "https"
          }),
          true
        );
      }
    },
    {
      name: "trusted request rejects foreign origin despite local host",
      run: () => {
        assert.equal(
          isTrustedOriginRequest({
            siteUrl: "https://shop.example.com",
            configuredOrigins: buildTrustedOrigins("https://shop.example.com"),
            origin: "https://evil.example.com",
            host: "shop.example.com",
            forwardedHost: "shop.example.com",
            forwardedProto: "https"
          }),
          false
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
          uploadStorageDriver: "s3",
          uploadPublicBaseUrl: "https://cdn.example.com/uploads/",
          uploadS3Region: "eu-central-1",
          nodeEnv: "development"
        });
        assert.equal(indicators.some((indicator) => indicator.name === "auth_secret"), true);
        assert.equal(indicators.some((indicator) => indicator.name === "smtp"), true);
        assert.equal(indicators.some((indicator) => indicator.name === "upload_storage"), true);
      }
    },
    {
      name: "ops status summary warns for low stock and stuck orders",
      run: () => {
        const summary = summarizeOpsStatus({
          lowStockProducts: 2,
          stuckOrders: 1,
          staleOutboxEvents: 1,
          deadOutboxEvents: 1,
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
        assert.equal(summary.signals.find((signal) => signal.name === "stale_outbox_events")?.ok, false);
        assert.equal(summary.signals.find((signal) => signal.name === "dead_outbox_events")?.ok, false);
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
    },
    {
      name: "log redaction masks secrets and tokens",
      run: () => {
        const redacted = redactLogValue({
          password: "SuperSecret12345",
          nested: {
            authSecret: "abcdefghijklmnopqrstuvwxyz",
            safe: "visible"
          },
          resetToken: "1234567890abcdef"
        }) as {
          password: string;
          nested: { authSecret: string; safe: string };
          resetToken: string;
        };

        assert.equal(redacted.password.includes("[REDACTED]") || redacted.password.includes("***"), true);
        assert.equal(redacted.nested.authSecret.includes("***"), true);
        assert.equal(redacted.nested.safe, "visible");
        assert.equal(redacted.resetToken.includes("***"), true);
      }
    },
    {
      name: "upload detector accepts valid png signature",
      run: async () => {
        const pngFile = new File(
          [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00])],
          "image.png",
          { type: "image/png" }
        );

        const result = await detectUploadExtension(pngFile);
        assert.equal(result.extension, "png");
      }
    },
    {
      name: "upload detector rejects spoofed mime type",
      run: async () => {
        const fakePng = new File(
          [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])],
          "image.png",
          { type: "image/png" }
        );

        await assert.rejects(
          () => detectUploadExtension(fakePng),
          /Dosya icerigi bildirilen gorsel turu ile eslesmiyor/
        );
      }
    },
    {
      name: "upload limits keep request envelope above file size cap",
      run: () => {
        assert.equal(MAX_UPLOAD_REQUEST_SIZE > MAX_FILE_SIZE, true);
      }
    },
    {
      name: "upload folder sanitizer rejects traversal segments",
      run: () => {
        assert.throws(() => sanitizeUploadFolder("../private"), /Gecersiz yukleme klasoru/);
      }
    },
    {
      name: "upload object key keeps safe nested folder shape",
      run: () => {
        const objectKey = buildUploadObjectKey("products/gallery", "png", "asset-1");
        assert.equal(objectKey, "products/gallery/asset-1.png");
      }
    },
    {
      name: "s3 target resolver supports path-style public urls",
      run: () => {
        const target = resolveS3ObjectTarget({
          bucket: "commerce-assets",
          region: "auto",
          endpoint: "https://account.r2.cloudflarestorage.com",
          key: "products/asset-1.png",
          forcePathStyle: true,
          publicBaseUrl: "https://cdn.example.com/uploads/"
        });

        assert.equal(target.url, "https://account.r2.cloudflarestorage.com/commerce-assets/products/asset-1.png");
        assert.equal(target.publicUrl, "https://cdn.example.com/uploads/products/asset-1.png");
      }
    },
    {
      name: "signed s3 put request includes authorization scope",
      run: () => {
        const request = buildSignedS3PutRequest({
          bucket: "commerce-assets",
          region: "eu-central-1",
          key: "products/asset-1.png",
          accessKeyId: "AKIATESTKEY",
          secretAccessKey: "test-secret-key",
          body: new Uint8Array([1, 2, 3, 4]),
          contentType: "image/png",
          now: new Date("2026-06-07T18:00:00.000Z")
        });

        assert.equal(request.url, "https://commerce-assets.s3.eu-central-1.amazonaws.com/products/asset-1.png");
        assert.equal(
          request.headers.authorization.includes(
            "Credential=AKIATESTKEY/20260607/eu-central-1/s3/aws4_request"
          ),
          true
        );
        assert.equal(typeof request.headers["x-amz-content-sha256"], "string");
      }
    },
    {
      name: "outbox retry backoff grows with attempts",
      run: () => {
        const base = new Date("2026-06-07T10:00:00.000Z");
        const secondAttempt = buildNextOutboxAvailability(base, 10, 1);
        const thirdAttempt = buildNextOutboxAvailability(base, 10, 3);
        assert.equal(secondAttempt.toISOString(), "2026-06-07T10:10:00.000Z");
        assert.equal(thirdAttempt.toISOString(), "2026-06-07T10:30:00.000Z");
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
