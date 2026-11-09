/**
 * Role-based access control for ChaseHorse Deploy.
 *
 * Roles:
 *   ADMINISTRATOR   - Full access, user & role management, AI provider settings
 *   OPERATIONS_MANAGER - Manage assignments, inspections, inventory, documents, reports
 *   FIELD_INSPECTOR - Execute inspections, checklists, tasks; view assigned records
 *   AUDITOR         - Read-only access to inspections, quality, POD, discrepancies
 *   READ_ONLY_VIEWER - Read-only access to all operational data
 */

export type UserRole =
  | "ADMINISTRATOR"
  | "OPERATIONS_MANAGER"
  | "FIELD_INSPECTOR"
  | "AUDITOR"
  | "READ_ONLY_VIEWER";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  READ_ONLY_VIEWER: 1,
  AUDITOR: 2,
  FIELD_INSPECTOR: 3,
  OPERATIONS_MANAGER: 4,
  ADMINISTRATOR: 5,
};

export interface PermissionContext {
  userId: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Returns true if the user's role is at or above the required level.
 */
export function hasRole(ctx: PermissionContext, ...requiredRoles: UserRole[]): boolean {
  if (!ctx.isActive) return false;
  const level = ROLE_HIERARCHY[ctx.role] ?? 0;
  return requiredRoles.some((r) => level >= (ROLE_HIERARCHY[r] ?? 0));
}

/**
 * Roles that can create/update/delete operational records.
 */
export const WRITE_ROLES: UserRole[] = [
  "ADMINISTRATOR",
  "OPERATIONS_MANAGER",
  "FIELD_INSPECTOR",
];

/**
 * Roles that can read operational records.
 */
export const READ_ROLES: UserRole[] = [
  "ADMINISTRATOR",
  "OPERATIONS_MANAGER",
  "FIELD_INSPECTOR",
  "AUDITOR",
  "READ_ONLY_VIEWER",
];

/**
 * Roles that can manage users and AI provider settings.
 */
export const ADMIN_ONLY_ROLES: UserRole[] = ["ADMINISTRATOR"];

/**
 * Throws if the context lacks any of the required roles. Use in API routes
 * to enforce authorization on the server.
 */
export function requireRole(
  ctx: PermissionContext,
  ...requiredRoles: UserRole[]
): void {
  if (!hasRole(ctx, ...requiredRoles)) {
    const err = new Error("Forbidden: insufficient permissions") as Error & {
      statusCode?: number;
    };
    err.statusCode = 403;
    throw err;
  }
}

/**
 * Throws if the user is not an administrator.
 */
export function requireAdmin(ctx: PermissionContext): void {
  requireRole(ctx, "ADMINISTRATOR");
}

/**
 * Extracts a PermissionContext from a NextAuth session.
 */
export function sessionToContext(session: unknown): PermissionContext | null {
  if (!session) return null;
  const user = (session as { user?: unknown }).user;
  if (!user) return null;
  return {
    userId: (user as { id?: string }).id ?? "",
    role: ((user as { role?: UserRole }).role ?? "READ_ONLY_VIEWER") as UserRole,
    isActive: (user as { isActive?: boolean }).isActive ?? false,
  };
}
