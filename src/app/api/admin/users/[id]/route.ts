import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  role: z.enum([
    "ADMINISTRATOR",
    "OPERATIONS_MANAGER",
    "FIELD_INSPECTOR",
    "AUDITOR",
    "READ_ONLY_VIEWER",
  ]).optional(),
  isActive: z.boolean().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const PATCH = withAuthz(
  async (ctx, req, params) => {
    try {
      const { id } = params as { id: string };
      const body = await req.json();
      const data = schema.parse(body);

      const user = await db.user.update({
        where: { id },
        data: { ...data },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      return Response.json(user);
    } catch (err) {
      return handleError(err, "Failed to update user");
    }
  },
  { admin: true },
);
