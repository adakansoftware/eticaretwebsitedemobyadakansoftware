import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

type AuditPayload = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue | null;
};

type AuditOptions = {
  adminUserId?: string;
  tx?: Prisma.TransactionClient;
};

export async function createAdminAuditLog(payload: AuditPayload, options: AuditOptions = {}) {
  const admin = options.adminUserId ? null : await requireAdmin();
  const writer = options.tx ?? prisma;
  const requestId = await getRequestId();

  try {
    await writer.adminAuditLog.create({
      data: {
        adminUserId: options.adminUserId ?? admin!.id,
        requestId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        summary: payload.summary,
        metadata: payload.metadata ?? undefined
      }
    });
  } catch (error) {
    await logError("admin.audit.write_failed", error, {
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId ?? null
    });
  }
}
