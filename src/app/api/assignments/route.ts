import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const AssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
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

export const GET = withAuthz(async (ctx, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");

    const where: any = {};
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    if (ctx.role === "FIELD_INSPECTOR") {
      where.assigneeId = ctx.userId;
    }

    const assignments = await db.assignment.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { inspections: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(assignments);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = AssignmentSchema.parse(body);

      const assignment = await db.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          location: data.location,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          assigneeId: data.assigneeId || undefined,
          creatorId: ctx.userId,
          status: "DRAFT",
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
      await auditLog(ctx, "CREATE_ASSIGNMENT", "Assignment", assignment.id, {
        title: assignment.title,
      });
      return Response.json(assignment, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create assignment");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
