import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { getTenantContext } from "@/lib/tenant";
import { z } from "zod";

const UpdateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().optional(),
  plan: z.enum(["COMMUNITY", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const GET = withAuthz(async (ctx, req, params) => {
  try {
    const { id } = params as { id: string };
    const tenant = await getTenantContext(req, ctx);

    // Verify tenant access
    if (!tenant.isSuperAdmin && tenant.organizationId !== id) {
      return Response.json({ error: "Access denied to requested organization." }, { status: 403 });
    }

    const org = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!org) {
      return Response.json({ error: "Organization not found." }, { status: 404 });
    }

    return Response.json(org);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load organization" },
      { status: 500 }
    );
  }
});

export const PUT = withAuthz(
  async (ctx, req, params) => {
    try {
      const { id } = params as { id: string };
      const tenant = await getTenantContext(req, ctx);

      // Verify tenant admin or super admin
      if (!tenant.isSuperAdmin && (tenant.organizationId !== id || !["OWNER", "ADMIN"].includes(tenant.memberRole))) {
        return Response.json({ error: "Forbidden: Only organization owners or admins can update settings." }, { status: 403 });
      }

      const body = await req.json();
      const data = UpdateOrgSchema.parse(body);

      const updated = await db.organization.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.domain !== undefined && { domain: data.domain }),
          ...(data.plan && { plan: data.plan }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.settings && { settings: JSON.stringify(data.settings) }),
        },
      });

      await auditLog(ctx, "UPDATE_ORGANIZATION", "Organization", id, data);
      return Response.json(updated);
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Failed to update organization" },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER"] }
);

