import assert from "node:assert/strict";
import { actionError, actionSuccess } from "../lib/action-response.ts";
import { toCsvContent, toCsvRow } from "../lib/csv.ts";
import { formatMoney } from "../lib/money.ts";
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
