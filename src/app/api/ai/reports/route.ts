import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { z } from "zod";

const ReportSchema = z.object({
  type: z.enum([
    "WAREHOUSE_INSPECTION_SUMMARY",
    "INVENTORY_DISCREPANCY",
    "POD_COMPLIANCE",
    "QUALITY_INSPECTION",
    "OUTSTANDING_TASKS",
  ]),
  title: z.string().min(1).max(200),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = ReportSchema.parse(body);

      const service = new AIService({ userId: ctx.userId });

      const [inspections, discrepancies, podDocs, tasks] = await Promise.all([
        db.inspection.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
        db.stockDiscrepancy.findMany({
          where: { status: "OPEN" },
          take: 20,
        }),
        db.pODDocument.findMany({ where: { status: "PENDING" }, take: 20 }),
        db.task.findMany({
          where: { status: { in: ["open", "in_progress"] } },
          take: 20,
        }),
      ]);

      const contextSummary = `
Authorized records available:
- Inspections: ${inspections.length} recent
- Open discrepancies: ${discrepancies.length}
- Pending PODs: ${podDocs.length}
- Open/in-progress tasks: ${tasks.length}

AI may only summarize these authorized records. Do not invent data.
`;

      const typeDescriptions: Record<string, string> = {
        WAREHOUSE_INSPECTION_SUMMARY: "Summarize warehouse inspection findings.",
        INVENTORY_DISCREPANCY: "Summarize open inventory discrepancies.",
        POD_COMPLIANCE: "Summarize pending POD documents and compliance gaps.",
        QUALITY_INSPECTION: "Summarize quality inspection results.",
        OUTSTANDING_TASKS: "Summarize outstanding and overdue tasks.",
      };

      let result;
      try {
        result = await service.generate({
          messages: [
            {
              role: "system",
              content: `You are a report drafting assistant for ChaseHorse Deploy.
${typeDescriptions[data.type]}
${contextSummary}
Output a draft report in markdown. Label it clearly as a draft requiring human review. Do not present uncertain predictions as facts.`,
            },
            {
              role: "user",
              content: `Draft a ${data.type} report titled "${data.title}" using the authorized records above.`,
            },
          ],
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err instanceof Error ? err.message : "Report generation failed" }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }

      const report = await db.report.create({
        data: {
          title: data.title,
          type: data.type as any,
          status: "DRAFT",
          content: result.text,
          generatedById: ctx.userId,
        },
      });

      return Response.json({
        reportId: report.id,
        title: report.title,
        type: report.type,
        status: report.status,
        draft: result.text,
        provider: result.provider,
        model: result.model,
      });
    } catch (err) {
      return handleError(err, "Report generation failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "AUDITOR"] },
);
