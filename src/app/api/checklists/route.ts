import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const ChecklistSchema = z.object({
  assignmentId: z.string(),
  checklistType: z.enum(["loading", "unloading"]),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  items: z.string().optional(),
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
      const assigned = await db.assignment.findMany({
        where: { assigneeId: ctx.userId },
        select: { id: true },
      });
      where.assignmentId = { in: assigned.map((a) => a.id) };
    }

    const checklists = await db.loadingUnloadingChecklist.findMany({
      where,
      include: {
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(checklists);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = ChecklistSchema.parse(body);

      const checklist = await db.loadingUnloadingChecklist.create({
        data: {
          assignmentId: data.assignmentId,
          checklistType: data.checklistType,
          status: data.status,
          items: data.items,
        },
        include: { assignment: { select: { id: true, title: true } } },
      });

      await auditLog(
        ctx,
        "CREATE_CHECKLIST",
        "LoadingUnloadingChecklist",
        checklist.id,
        { checklistType: data.checklistType },
      );
      return Response.json(checklist, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create checklist");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
