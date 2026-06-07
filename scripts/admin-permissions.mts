import "./load-env.mts";
import { Role } from "@prisma/client";
import { allAdminPermissions, buildAdminPermissionPatch, normalizeAdminPermissions } from "../lib/admin-policy.ts";
import { prisma } from "../lib/prisma.ts";

function readArg(name: string) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function parsePermissionList(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is (typeof allAdminPermissions)[number] =>
      allAdminPermissions.includes(entry as (typeof allAdminPermissions)[number])
    );
}

const apply = process.argv.includes("--apply");
const clear = process.argv.includes("--clear");
const email = readArg("email");
const grant = parsePermissionList(readArg("grant"));
const revoke = parsePermissionList(readArg("revoke"));

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      adminPermissions: true
    }
  });

  if (!email) {
    console.log(
      JSON.stringify(
        {
          mode: "list",
          availablePermissions: allAdminPermissions,
          admins: admins.map((admin) => ({
            id: admin.id,
            email: admin.email,
            name: admin.name,
            permissions: normalizeAdminPermissions(admin.adminPermissions) ?? "ALL"
          }))
        },
        null,
        2
      )
    );
    return;
  }

  const target = admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase());
  if (!target) {
    throw new Error("Admin kullanicisi bulunamadi.");
  }

  const nextPermissions = buildAdminPermissionPatch(target.adminPermissions, {
    grant,
    revoke,
    clear
  });

  if (apply) {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        adminPermissions: nextPermissions
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        target: {
          id: target.id,
          email: target.email,
          name: target.name
        },
        availablePermissions: allAdminPermissions,
        before: normalizeAdminPermissions(target.adminPermissions) ?? "ALL",
        requested: {
          grant,
          revoke,
          clear
        },
        after: nextPermissions
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Admin permission command failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
