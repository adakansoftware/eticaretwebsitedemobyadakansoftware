import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type AuditPayload = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue | null;
};

export async function createAdminAuditLog(payload: AuditPayload) {
  const admin = await requireAdmin();

  await prisma.adminAuditLog.create({
    data: {
      adminUserId: admin.id,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId ?? null,
      summary: payload.summary,
      metadata: payload.metadata ?? undefined
    }
  });
}
