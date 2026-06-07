import process from "node:process";
import "./load-env.mts";
import { prisma } from "../lib/prisma.ts";
import { buildOpsStatusSnapshot } from "./ops-shared.mts";

async function main() {
  const summary = await buildOpsStatusSnapshot();
  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Ops assert failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
