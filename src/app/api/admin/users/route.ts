import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const UserSchema = z.object({
  name: z.string().optional(),
  role: z.enum([
    "ADMINISTRATOR",
    "OPERATIONS_MANAGER",
    "FIELD_INSPECTOR",
    "AUDITOR",
    "READ_ONLY_VIEWER",
  ]),
  isActive: z.boolean(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return Response.json(users);
  } catch (err) {
    return handleError(err, "Failed to load users");
  }
});

export const PATCH = withAuthz(
  async (ctx, req, params) => {
    try {
      const body = await req.json();
      const { userId } = body;
      const data = UserSchema.parse(body);

      const user = await db.user.update({
        where: { id: userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          role: data.role,
          isActive: data.isActive,
        },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      await auditLog(ctx, "UPDATE_USER_ROLE", "User", userId, {
        role: data.role,
        isActive: data.isActive,
      });

      return Response.json(user);
    } catch (err) {
      return handleError(err, "Failed to update user");
    }
  },
  { admin: true },
);
