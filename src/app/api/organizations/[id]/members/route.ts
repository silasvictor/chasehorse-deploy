import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { getTenantContext } from "@/lib/tenant";
import { z } from "zod";

const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const POST = withAuthz(
  async (ctx, req, params) => {
    try {
      const { id: organizationId } = params as { id: string };
      const tenant = await getTenantContext(req, ctx);

      if (!tenant.isSuperAdmin && (tenant.organizationId !== organizationId || !["OWNER", "ADMIN"].includes(tenant.memberRole))) {
        return Response.json({ error: "Forbidden: insufficient permissions to manage members." }, { status: 403 });
      }

      const body = await req.json();
      const { email, role } = AddMemberSchema.parse(body);

      const targetUser = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!targetUser) {
        return Response.json({ error: `User with email "${email}" not found.` }, { status: 404 });
      }

      // Check if already a member
      const existing = await db.organizationMember.findFirst({
        where: { organizationId, userId: targetUser.id },
      });

      if (existing) {
        return Response.json({ error: "User is already a member of this organization." }, { status: 409 });
      }

      const membership = await db.organizationMember.create({
        data: {
          organizationId,
          userId: targetUser.id,
          role,
        },
      });

      await auditLog(ctx, "ADD_ORGANIZATION_MEMBER", "OrganizationMember", membership.id, {
        organizationId,
        userId: targetUser.id,
        role,
      });

      return Response.json(membership, { status: 201 });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Failed to add member" },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER"] }
);

