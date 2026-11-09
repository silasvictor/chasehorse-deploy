import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { ragService } from "@/lib/ai/rag-service";
import { z } from "zod";

const InspectionSchema = z.object({
  inspectionId: z.string().optional(),
  title: z.string().optional(),
  type: z.enum(["WAREHOUSE", "LOADING_UNLOADING", "QUALITY", "STOCK_TAKING", "POD_VERIFICATION", "GST_AUDIT"]).optional(),
  observations: z.string().optional(),
  findings: z.string().optional(),
  analysisType: z.enum(["SUMMARIZE", "CATEGORIZE", "DETECT_ISSUES", "COMPARE_CRITERIA", "DRAFT_REPORT", "RECURRING_ISSUES"]),
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
      const data = InspectionSchema.parse(body);

      // Get authorized inspection data
      let inspections;
      if (data.inspectionId) {
        const insp = await db.inspection.findUnique({
          where: { id: data.inspectionId },
          include: {
            warehouse: { select: { id: true, name: true } },
            qualityRecords: { include: { inspector: { select: { id: true, name: true } } } },
            assignment: { select: { id: true, title: true } },
          },
        });
        inspections = insp ? [insp] : [];
      } else {
        inspections = await db.inspection.findMany({
          where: data.type ? { type: data.type } : {},
          include: {
            warehouse: { select: { id: true, name: true } },
            qualityRecords: { include: { inspector: { select: { id: true, name: true } } } },
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        });
      }

      if (inspections.length === 0) {
        return new Response(JSON.stringify({ error: "No inspections found matching criteria" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const service = new AIService({ userId: ctx.userId });

      let analysisResult: string;
      let structuredData: any = {};

      if (data.analysisType === "SUMMARIZE") {
        const context = inspections.map((i) => `
Inspection: ${i.title}
Type: ${i.type}
Status: ${i.status}
Warehouse: ${i.warehouse?.name || "Unknown"}
Inspector: ${(i as any).inspector?.name || "Unassigned"}
Scheduled: ${i.scheduledAt || "Not scheduled"}
Completed: ${i.completedAt || "Not completed"}
Findings: ${i.findings || "No findings recorded"}
Report: ${i.report || "No report generated"}
Quality Records: ${i.qualityRecords?.map((q) => `${q.item}: ${q.result} (${q.severity})`).join(", ") || "None"}
`).join("\n---\n");

        analysisResult = (await service.generate({
          messages: [
            { role: "system", content: `You are an inspection analysis assistant. Summarize the following inspection records. Focus on key findings, trends, and actionable insights. Be concise and factual.` },
            { role: "user", content: `Analyze these inspection records:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        })).text;
      } else if (data.analysisType === "DETECT_ISSUES") {
        const context = inspections.map((i) => `
Inspection: ${i.title}
Status: ${i.status}
Findings: ${i.findings || "None"}
Quality Issues: ${i.qualityRecords?.filter((q) => q.result === "fail").map((q) => `${q.item}: ${q.notes || ""} (${q.severity})`).join(", ") || "None"}
`).join("\n---\n");

        analysisResult = (await service.generate({
          messages: [
            { role: "system", content: `You are an inspection quality analyst. Identify potential issues, failures, and concerns from the following inspection records. Flag any items that need attention.` },
            { role: "user", content: `Analyze for issues:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        })).text;
      } else if (data.analysisType === "DRAFT_REPORT") {
        const context = inspections.map((i) => `
Inspection: ${i.title}
Type: ${i.type}
Status: ${i.status}
Findings: ${i.findings || "None"}
Report: ${i.report || "None"}
Quality Records: ${i.qualityRecords?.map((q) => `${q.item}: ${q.result}`).join(", ") || "None"}
`).join("\n---\n");

        analysisResult = (await service.generate({
          messages: [
            { role: "system", content: `You are an inspection report writer. Draft a professional inspection report based on the following records. Include: executive summary, key findings, issues identified, recommendations, and conclusion. Label as DRAFT.` },
            { role: "user", content: `Draft a report:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 2000,
        })).text;
      } else {
        analysisResult = (await service.generate({
          messages: [
            { role: "system", content: `You are an inspection analysis assistant. Analyze the following inspection records based on the user's specific request.` },
            { role: "user", content: `Analyze these inspections:\n\n${inspections.map((i) => `${i.title}: ${i.findings || "No findings"}`).join("\n")}\n\nQuestion: ${data.observations || "Provide a general analysis."}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        })).text;
      }

      // Save AI analysis as a draft report if requested
      let reportId: string | null = null;
      if (data.analysisType === "DRAFT_REPORT") {
        const report = await db.report.create({
          data: {
            title: `AI Draft: ${inspections[0]?.title || "Inspection Analysis"} - ${new Date().toLocaleDateString()}`,
            type: "WAREHOUSE_INSPECTION_SUMMARY",
            status: "DRAFT",
            content: analysisResult,
            generatedById: ctx.userId,
          },
        });
        reportId = report.id;
      }

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_INSPECTION_ANALYSIS",
          entityType: "Inspection",
          entityId: data.inspectionId || "multiple",
          metadata: JSON.stringify({
            analysisType: data.analysisType,
            inspectionCount: inspections.length,
            provider: "gemini",
          }),
        },
      });

      return Response.json({
        analysisType: data.analysisType,
        analysis: analysisResult,
        inspectionsAnalyzed: inspections.length,
        reportId,
        structuredData,
      });
    } catch (err) {
      return handleError(err, "Inspection analysis failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);