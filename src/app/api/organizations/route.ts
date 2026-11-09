import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const CreateOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and dashes"),
  domain: z.string().optional(),
  plan: z.enum(["COMMUNITY", "PROFESSIONAL", "ENTERPRISE"]).default("PROFESSIONAL"),
  settings: z.record(z.string(), z.any()).optional(),
});

export const GET = withAuthz(async (ctx) => {
  try {
    let orgs;
    if (ctx.role === "ADMINISTRATOR") {
      // Super admin can view all organizations
      orgs = await db.organization.findMany({
        include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Normal users view organizations they are a member of
      const memberships = await db.organizationMember.findMany({
        where: { userId: ctx.userId },
        include: { organization: true },
      });
      orgs = memberships.map((m: any) => ({
        ...m.organization,
        userRole: m.role,
      }));
    }
    return Response.json(orgs);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load organizations" },
      { status: 500 }
    );
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = CreateOrgSchema.parse(body);

      // Check slug uniqueness
      const existing = await db.organization.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        return Response.json({ error: "An organization with this slug already exists." }, { status: 409 });
      }

      const org = await db.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          domain: data.domain || null,
          plan: data.plan,
          settings: data.settings ? JSON.stringify(data.settings) : null,
          isActive: true,
        },
      });

      // Add creator as OWNER
      await db.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: ctx.userId,
          role: "OWNER",
        },
      });

      await auditLog(ctx, "CREATE_ORGANIZATION", "Organization", org.id, {
        name: org.name,
        slug: org.slug,
      });

      return Response.json(org, { status: 201 });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Failed to create organization" },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER"] }
);

