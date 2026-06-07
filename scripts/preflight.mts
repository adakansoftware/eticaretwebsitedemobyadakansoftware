import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const ignoredDirs = new Set([".git", ".next", "node_modules", "playwright-report", "test-results"]);
const suspiciousPatterns = ["TO" + "DO", "FIX" + "ME", "\uFFFD"];
const findings: Array<{ file: string; pattern: string }> = [];
const migrationNames: string[] = [];

async function walk(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path.relative(repoRoot, dir) === "prisma\\migrations" || path.relative(repoRoot, dir) === "prisma/migrations") {
        migrationNames.push(entry.name);
      }
      await walk(fullPath);
      continue;
    }

    if (!/\.(ts|tsx|mts|js|mjs|json|md|prisma|sql)$/.test(entry.name)) continue;

    const content = await fs.readFile(fullPath, "utf8");
    for (const pattern of suspiciousPatterns) {
      if (content.includes(pattern)) {
        findings.push({ file: path.relative(repoRoot, fullPath), pattern });
      }
    }
  }
}

function validateMigrationNames() {
  for (const name of migrationNames) {
    if (!/^\d{14}_[a-z0-9_]+$/.test(name)) {
      findings.push({
        file: path.join("prisma", "migrations", name),
        pattern: "invalid-migration-name"
      });
    }
  }
}

async function main() {
  await walk(repoRoot);
  validateMigrationNames();

  if (findings.length > 0) {
    console.error("Preflight failed.");
    for (const finding of findings) {
      console.error(`- ${finding.file}: ${finding.pattern}`);
    }
    process.exit(1);
  }

  console.log("Preflight passed.");
}

main().catch((error) => {
  console.error("Preflight failed unexpectedly.");
  console.error(error);
  process.exit(1);
});
