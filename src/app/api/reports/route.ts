import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const ReportSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum([
    "WAREHOUSE_INSPECTION_SUMMARY",
    "INVENTORY_DISCREPANCY",
    "POD_COMPLIANCE",
    "QUALITY_INSPECTION",
    "OUTSTANDING_TASKS",
  ]),
  content: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const reports = await db.report.findMany({
      where: { generatedById: ctx.userId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(reports);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = ReportSchema.parse(body);
      const report = await db.report.create({
        data: {
          title: data.title,
          type: data.type,
          status: "DRAFT",
          content: data.content || null,
          generatedById: ctx.userId,
        },
      });
      await auditLog(ctx, "GENERATE_REPORT", "Report", report.id, {
        title: report.title,
        type: report.type,
      });
      return Response.json(report, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create report");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "AUDITOR"] },
);
