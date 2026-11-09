import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const InspectionSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum([
    "WAREHOUSE",
    "LOADING_UNLOADING",
    "QUALITY",
    "STOCK_TAKING",
    "POD_VERIFICATION",
    "GST_AUDIT",
  ]).default("QUALITY"),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  warehouseId: z.string().optional().nullable(),
  assignmentId: z.string().optional().nullable(),
  inspectorId: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  findings: z.string().optional(),
  report: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const inspections = await db.inspection.findMany({
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        assignment: { select: { id: true, title: true } },
        inspector: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(inspections);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = InspectionSchema.parse(body);
      const inspection = await db.inspection.create({
        data: {
          title: data.title,
          type: data.type,
          status: data.status,
          warehouseId: data.warehouseId || undefined,
          assignmentId: data.assignmentId || undefined,
          inspectorId: data.inspectorId || ctx.userId,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          findings: data.findings,
          report: data.report,
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          inspector: { select: { id: true, name: true } },
        },
      });
      await auditLog(ctx, "CREATE_INSPECTION", "Inspection", inspection.id, {
        title: inspection.title,
        type: inspection.type,
      });
      return Response.json(inspection, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create inspection");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
