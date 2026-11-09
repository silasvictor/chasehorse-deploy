import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["open", "in_progress", "completed", "overdue"]).default("open"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignmentId: z.string().optional().nullable(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const where: any = {};
    if (ctx.role === "FIELD_INSPECTOR") {
      where.assigneeId = ctx.userId;
    }
    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(tasks);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = TaskSchema.parse(body);
      const task = await db.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assigneeId: data.assigneeId || undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          assignmentId: data.assignmentId || undefined,
        },
        include: { assignee: { select: { id: true, name: true } } },
      });
      return Response.json(task, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create task");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
