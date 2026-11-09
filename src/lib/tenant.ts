/**
 * Enterprise Multi-Tenancy & Organization Isolation
 *
 * Enforces strict boundary isolation across all data access, APIs, file storage,
 * and background operations. Tenant access is always derived and verified
 * from server-side session identity and organization membership.
 */

import { db } from "./db";
import { type PermissionContext } from "./permissions";

export const DEFAULT_ORGANIZATION_ID = "org-apex-001";

export interface TenantContext {
  organizationId: string;
  organizationName: string;
  memberRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  isSuperAdmin: boolean;
}

/**
 * Resolves and strictly verifies tenant access for the authenticated user.
 *
 * Hierarchy of tenant ID resolution:
 * 1. Request header `x-organization-id`
 * 2. Query parameter `orgId`
 * 3. Cookie `chasehorse_tenant`
 * 4. User's primary organization membership
 *
 * Security: Non-administrators CANNOT specify an organization ID that they
 * do not belong to. Attempting to do so triggers a 403 Forbidden.
 */
export async function getTenantContext(
  req: Request,
  userCtx: PermissionContext
): Promise<TenantContext> {
  const url = new URL(req.url);
  const headerOrgId = req.headers.get("x-organization-id");
  const queryOrgId = url.searchParams.get("orgId");
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/chasehorse_tenant=([^;]+)/);
  const cookieOrgId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  const requestedOrgId = headerOrgId || queryOrgId || cookieOrgId;
  const isSuperAdmin = userCtx.role === "ADMINISTRATOR";

  if (isSuperAdmin && requestedOrgId) {
    const org = await db.organization.findUnique({
      where: { id: requestedOrgId },
    });
    if (org) {
      return {
        organizationId: org.id,
        organizationName: org.name,
        memberRole: "OWNER",
        isSuperAdmin: true,
      };
    }
  }

  // Find user's organization memberships
  const memberships = await db.organizationMember.findMany({
    where: { userId: userCtx.userId },
    include: { organization: true },
  });

  if (memberships.length === 0) {
    // If no explicit membership yet, fallback to default organization for demo/dev users
    const defaultOrg = await db.organization.findUnique({
      where: { id: DEFAULT_ORGANIZATION_ID },
    });
    return {
      organizationId: defaultOrg?.id || DEFAULT_ORGANIZATION_ID,
      organizationName: defaultOrg?.name || "Apex Global Logistics",
      memberRole: isSuperAdmin ? "OWNER" : "MEMBER",
      isSuperAdmin,
    };
  }

  // If client requested a specific organization, verify membership
  if (requestedOrgId) {
    const matched = memberships.find((m) => m.organizationId === requestedOrgId);
    if (!matched) {
      if (isSuperAdmin) {
        const org = await db.organization.findUnique({ where: { id: requestedOrgId } });
        return {
          organizationId: requestedOrgId,
          organizationName: org?.name || "Enterprise Organization",
          memberRole: "OWNER",
          isSuperAdmin: true,
        };
      }
      const err = new Error(
        `Cross-tenant access denied: You are not an authorized member of organization "${requestedOrgId}".`
      ) as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }
    return {
      organizationId: matched.organizationId,
      organizationName: matched.organization?.name || "Apex Global Logistics",
      memberRole: (matched.role as any) || "MEMBER",
      isSuperAdmin,
    };
  }

  // Default to user's first membership
  const primary = memberships[0];
  return {
    organizationId: primary.organizationId,
    organizationName: primary.organization?.name || "Apex Global Logistics",
    memberRole: (primary.role as any) || "MEMBER",
    isSuperAdmin,
  };
}

/**
 * Augments a Prisma/Local-DB where clause with strict tenant scoping.
 */
export function withTenantFilter<T extends Record<string, any>>(
  where: T = {} as T,
  organizationId: string
): T & { organizationId: string } {
  return {
    ...where,
    organizationId,
  };
}

/**
 * Validates that a fetched entity belongs to the current tenant.
 * Prevents Insecure Direct Object References (IDOR).
 */
export function enforceTenantOwnership(
  entity: any,
  tenantCtx: TenantContext,
  entityName = "Record"
): void {
  if (!entity) return;
  if (tenantCtx.isSuperAdmin) return;

  if (entity.organizationId && entity.organizationId !== tenantCtx.organizationId) {
    const err = new Error(
      `Forbidden: ${entityName} belongs to another organization.`
    ) as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }
}

