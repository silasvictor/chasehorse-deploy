/**
 * Audit logging for important actions.
 */

import { db } from "@/lib/db";

export type AuditAction =
  | "CREATE_ASSIGNMENT"
  | "CREATE_SHIPMENT"
  | "UPDATE_ASSIGNMENT"
  | "DELETE_ASSIGNMENT"
  | "CREATE_INSPECTION"
  | "UPDATE_INSPECTION"
  | "CREATE_DISCREPANCY"
  | "RESOLVE_DISCREPANCY"
  | "UPLOAD_DOCUMENT"
  | "DELETE_DOCUMENT"
  | "GENERATE_REPORT"
  | "PUBLISH_REPORT"
  | "AI_CHAT"
  | "CHANGE_AI_PROVIDER"
  | "UPDATE_USER_ROLE"
  | "DEACTIVATE_USER"
  | "CREATE_CHECKLIST"
  | "UPDATE_CHECKLIST"
  | "DELETE_CHECKLIST"
  | "AI_DOCUMENT_INTELLIGENCE"
  | "AI_REPORT_EXPORT"
  | "CREATE_ORGANIZATION"
  | "UPDATE_ORGANIZATION"
  | "ADD_ORGANIZATION_MEMBER"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED";

export interface AuditContext {
  userId: string;
  role?: string;
  isActive?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export async function auditLog(
  ctx: AuditContext,
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: ctx.userId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });
  } catch {
    // Audit logging must not break the primary operation.
    console.error("Audit log failed");
  }
}
