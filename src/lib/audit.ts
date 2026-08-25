import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  actorUserId?: string;
  organizationId?: string;
  message?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      message: input.message,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
