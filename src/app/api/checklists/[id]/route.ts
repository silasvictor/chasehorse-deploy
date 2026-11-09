import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import type { RouteParams } from "@/lib/api";

const UpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  items: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx, _req, params) => {
  try {
    const { id } = params as { id: string };
    const checklist = await db.loadingUnloadingChecklist.findUnique({
      where: { id },
      include: { assignment: { select: { id: true, title: true } } },
    });

    if (!checklist) {
      return new Response(JSON.stringify({ error: "Checklist not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(checklist);
  } catch (err) {
    return handleError(err, "Failed to load checklist");
  }
});

export const PUT = withAuthz(
  async (ctx, req, params) => {
    try {
      const { id } = params as { id: string };
      const body = await req.json();
      const data = UpdateSchema.parse(body);

      const checklist = await db.loadingUnloadingChecklist.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.items !== undefined && { items: data.items }),
        },
        include: { assignment: { select: { id: true, title: true } } },
      });

      await auditLog(ctx, "UPDATE_CHECKLIST", "LoadingUnloadingChecklist", id, data);
      return Response.json(checklist);
    } catch (err) {
      return handleError(err, "Failed to update checklist");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);

export const DELETE = withAuthz(
  async (_ctx, _req, params) => {
    try {
      const { id } = params as { id: string };
      await db.loadingUnloadingChecklist.delete({ where: { id } });
      return new Response(null, { status: 204 });
    } catch (err) {
      return handleError(err, "Failed to delete checklist");
    }
  },
  { roles: ["ADMINISTRATOR"] },
);
