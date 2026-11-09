/**
 * AI Inspection Intelligence API Route.
 *
 * Provides AI-powered inspection analysis including:
 * - Summarizing inspection observations
 * - Identifying potentially important issues
 * - Categorizing findings
 * - Comparing observations with configured inspection criteria
 * - Highlighting missing inspection information
 * - Generating draft inspection reports
 * - Identifying recurring issues across historical records
 *
 * All operations are server-side with proper role-based access control.
 * AI outputs are draft suggestions only - never approved facts.
 */

import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { ragService } from "@/lib/ai/rag-service";
import { z } from "zod";

const InspectionIntelligenceSchema = z.object({
  inspectionId: z.string().optional(),
  type: z.enum(["WAREHOUSE", "LOADING_UNLOADING", "QUALITY", "STOCK_TAKING", "POD_VERIFICATION", "GST_AUDIT"]).optional(),
  analysisType: z.enum(["SUMMARIZE", "IDENTIFY_ISSUES", "CATEGORIZE", "COMPARE_CRITERIA", "DRAFT_REPORT", "RECURRING_ISSUES", "ALL"]).default("SUMMARIZE"),
  customPrompt: z.string().optional(),
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
      const data = InspectionIntelligenceSchema.parse(body);

      // Build query based on filters
      const where: any = {};
      if (data.inspectionId) {
        where.id = data.inspectionId;
      }
      if (data.type) {
        where.type = data.type;
      }

      const inspections = await db.inspection.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          inspector: { select: { id: true, name: true } },
          assignment: { select: { id: true, title: true } },
          qualityRecords: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });

      if (inspections.length === 0) {
        return new Response(
          JSON.stringify({ error: "No inspections found matching criteria" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      const service = new AIService({ userId: ctx.userId });

      // Build context from inspection data
      const context = inspections.map((insp) => {
        const qualityFailures = insp.qualityRecords?.filter((q: any) => q.result === "fail") || [];
        const qualityWarnings = insp.qualityRecords?.filter((q: any) => q.result === "warning") || [];

        return `
Inspection ID: ${insp.id}
Title: ${insp.title}
Type: ${insp.type}
Status: ${insp.status}
Warehouse: ${insp.warehouse?.name || "Unknown"} (${insp.warehouse?.code || "N/A"})
Inspector: ${insp.inspector?.name || "Unassigned"}
Scheduled: ${insp.scheduledAt || "Not scheduled"}
Completed: ${insp.completedAt || "Not completed"}
Findings: ${insp.findings || "None recorded"}
Report: ${insp.report || "None reported"}
Quality Records: ${insp.qualityRecords?.length || 0} total
  - Failures: ${qualityFailures.length}
  - Warnings: ${qualityWarnings.length}
  - Details: ${qualityFailures.map((q: any) => `${q.item}: ${q.notes || "No notes"}`).join(", ") || "None"}
`;
      }).join("\n---\n");

      // Build system prompt based on analysis type
      const systemPrompt = `You are an AI Inspection Intelligence Assistant for ChaseHorse Deploy.

Role: Analyze inspection records and provide intelligent insights about warehouse inspections, quality inspections, loading/unloading supervision, stock taking, POD verification, and GST audits.

Scope rules:
- ONLY use the inspection data provided in the context. Do not invent inspection results, quantities, or business metrics.
- Do not certify that an inspection passed or failed - that is a human decision.
- Clearly distinguish AI-generated suggestions from confirmed inspection findings.
- If information is unavailable, explain exactly what data is missing.
- Present uncertain predictions as suggestions, not confirmed facts.
- Do not approve or reject inspections - provide analysis only.

Current user role: ${ctx.role}

Inspection Data Context:
${context}

Analysis Type: ${data.analysisType}
${data.customPrompt ? `Additional Instructions: ${data.customPrompt}` : ""}

Provide a comprehensive analysis based on the inspection data above.`;

      const result = await service.generate({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze the following inspection data:\n\n${context}\n\nAnalysis type: ${data.analysisType}` },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      // Log the AI analysis
      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_INSPECTION_ANALYSIS",
          entityType: "Inspection",
          entityId: data.inspectionId || "multiple",
          metadata: JSON.stringify({
            analysisType: data.analysisType,
            inspectionCount: inspections.length,
            provider: result.provider,
            model: result.model,
          }),
        },
      });

      return Response.json({
        analysisType: data.analysisType,
        analysis: result.text,
        inspectionsAnalyzed: inspections.length,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleError(err, "Inspection intelligence analysis failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);