ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

ALTER TABLE "AdminAuditLog" ADD COLUMN "requestId" TEXT;

CREATE TABLE "OperationReplayGuard" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationReplayGuard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationReplayGuard_scope_key_key" ON "OperationReplayGuard"("scope", "key");
CREATE INDEX "OperationReplayGuard_expiresAt_idx" ON "OperationReplayGuard"("expiresAt");
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");
CREATE INDEX "AdminAuditLog_requestId_idx" ON "AdminAuditLog"("requestId");
