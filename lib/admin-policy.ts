import type { Prisma } from "@prisma/client";

export const adminPermissions = {
  catalogWrite: "catalog:write",
  inventoryWrite: "inventory:write",
  ordersWrite: "orders:write",
  promotionsWrite: "promotions:write",
  reviewsModerate: "reviews:moderate",
  settingsWrite: "settings:write",
  customersRead: "customers:read",
  auditRead: "audit:read",
  opsRead: "ops:read",
  mediaUpload: "media:upload"
} as const;

export type AdminPermission = (typeof adminPermissions)[keyof typeof adminPermissions];

export const allAdminPermissions = Object.values(adminPermissions);

export type AdminPolicyUser = {
  role: "USER" | "ADMIN";
  adminPermissions?: Prisma.JsonValue | null;
};

export function normalizeAdminPermissions(value: Prisma.JsonValue | null | undefined) {
  if (!value) {
    return null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const permissions = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is AdminPermission =>
      allAdminPermissions.includes(entry as AdminPermission)
    );

  return permissions.length > 0 ? Array.from(new Set(permissions)) : [];
}

export function hasAdminPermission(user: AdminPolicyUser | null | undefined, permission: AdminPermission) {
  if (!user || user.role !== "ADMIN") {
    return false;
  }

  const normalizedPermissions = normalizeAdminPermissions(user.adminPermissions);

  if (normalizedPermissions === null) {
    return true;
  }

  return normalizedPermissions.includes(permission);
}

export function buildAdminPermissionPatch(
  currentValue: Prisma.JsonValue | null | undefined,
  options: {
    grant?: AdminPermission[];
    revoke?: AdminPermission[];
    clear?: boolean;
  }
) {
  if (options.clear) {
    return [] satisfies AdminPermission[];
  }

  const current = normalizeAdminPermissions(currentValue) ?? allAdminPermissions.slice();
  const next = new Set(current);

  for (const permission of options.grant ?? []) {
    next.add(permission);
  }

  for (const permission of options.revoke ?? []) {
    next.delete(permission);
  }

  return Array.from(next).sort();
}
