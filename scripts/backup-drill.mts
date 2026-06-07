import process from "node:process";
import "./load-env.mts";
import { env } from "../lib/env.ts";

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function redactDatabaseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.username) {
      url.username = "***";
    }
    if (url.password) {
      url.password = "***";
    }
    return url.toString();
  } catch {
    return "[REDACTED]";
  }
}

function buildDumpCommand() {
  const executable = env.BACKUP_PGDUMP_PATH || "pg_dump";
  const sourceUrl = env.BACKUP_DRILL_DATABASE_URL || env.DATABASE_URL;
  const fileName = `backup-drill-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`;

  return {
    executable,
    fileName,
    sourceUrl: redactDatabaseUrl(sourceUrl),
    command: `${executable} --format=custom --no-owner --no-privileges --file ${fileName} "${redactDatabaseUrl(sourceUrl)}"`
  };
}

function buildRestoreCommand(fileName: string) {
  const executable = env.BACKUP_PSQL_PATH || "psql";
  const restoreUrl = env.BACKUP_DRILL_RESTORE_DATABASE_URL;

  if (!restoreUrl) {
    return null;
  }

  return {
    executable,
    restoreUrl: redactDatabaseUrl(restoreUrl),
    command: `${executable} "${redactDatabaseUrl(restoreUrl)}" < ${fileName}`
  };
}

async function main() {
  const assertReady = hasFlag("--assert-ready");
  const dump = buildDumpCommand();
  const restore = buildRestoreCommand(dump.fileName);

  const issues: string[] = [];
  if (!env.BACKUP_DRILL_DATABASE_URL && !env.DATABASE_URL) {
    issues.push("Kaynak veritabani URL'i bulunamadi");
  }

  if (!env.BACKUP_DRILL_RESTORE_DATABASE_URL) {
    issues.push("Restore tatbikati icin BACKUP_DRILL_RESTORE_DATABASE_URL tanimli degil");
  }

  const report = {
    mode: assertReady ? "assert-ready" : "dry-run",
    observedAt: new Date().toISOString(),
    ready: issues.length === 0,
    issues,
    dump,
    restore
  };

  console.log(JSON.stringify(report, null, 2));

  if (assertReady && issues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Backup drill failed.");
  console.error(error);
  process.exit(1);
});
