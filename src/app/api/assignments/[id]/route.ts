import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import type { RouteParams } from "@/lib/api";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum([
    "DRAFT",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "OVERDUE",
  ]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  location: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
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
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true } },
        inspections: true,
        tasks: true,
        checklists: true,
        podDocuments: true,
      },
    });

    if (!assignment) {
      return new Response(JSON.stringify({ error: "Assignment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (ctx.role === "FIELD_INSPECTOR" && assignment.assigneeId !== ctx.userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(assignment);
  } catch (err) {
    return handleError(err, "Failed to load assignment");
  }
});

export const PUT = withAuthz(
  async (ctx, req, params) => {
    try {
      const { id } = params as { id: string };
      const body = await req.json();
      const data = UpdateSchema.parse(body);

      // Field inspectors can only update assignments assigned to them
      if (ctx.role === "FIELD_INSPECTOR") {
        const existing = await db.assignment.findUnique({
          where: { id },
          select: { assigneeId: true },
        });
        if (!existing || existing.assigneeId !== ctx.userId) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      const assignment = await db.assignment.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.priority !== undefined && { priority: data.priority }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          }),
          ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
        },
      });

      await auditLog(ctx, "UPDATE_ASSIGNMENT", "Assignment", id, data);
      return Response.json(assignment);
    } catch (err) {
      return handleError(err, "Failed to update assignment");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);

export const DELETE = withAuthz(
  async (_ctx, _req, params) => {
    try {
      const { id } = params as { id: string };
      await db.assignment.delete({ where: { id } });
      return new Response(null, { status: 204 });
    } catch (err) {
      return handleError(err, "Failed to delete assignment");
    }
  },
  { roles: ["ADMINISTRATOR"] },
);
