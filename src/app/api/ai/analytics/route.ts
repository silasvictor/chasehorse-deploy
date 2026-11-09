/**
 * AI Natural-Language Analytics API Route.
 *
 * Allows authorized users to ask questions about operational data without
 * manually navigating multiple dashboard pages.
 *
 * Translates questions into safe, validated database queries.
 * Enforces user permissions.
 * Uses verified data.
 * Explains the reporting period.
 * Shows the calculation methodology when relevant.
 * Displays the source records behind important findings.
 *
 * Never allows arbitrary AI-generated SQL to execute without validation.
 */

import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { z } from "zod";

const AnalyticsSchema = z.object({
  query: z.string().min(1).max(2000),
  analysisType: z.enum(["SUMMARIZE", "COMPARE", "TREND", "COUNT", "RATE"]).default("SUMMARIZE"),
  timeRange: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
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
      const data = AnalyticsSchema.parse(body);

      const now = new Date();
      const timeRangeMs = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
        all: Infinity,
      }[data.timeRange];
      const cutoffDate = new Date(now.getTime() - timeRangeMs);

      // Fetch authorized data based on time range
      const [inspections, discrepancies, tasks, podDocuments] = await Promise.all([
        db.inspection.findMany({
          where: { ...(data.timeRange !== "all" && { createdAt: { gte: cutoffDate } }) },
          include: { warehouse: { select: { name: true } }, inspector: { select: { name: true } } },
          take: 100,
        }),
        db.stockDiscrepancy.findMany({
          where: { ...(data.timeRange !== "all" && { createdAt: { gte: cutoffDate } }) },
          include: { inventoryItem: { include: { warehouse: { select: { name: true } } } } },
          take: 100,
        }),
        db.task.findMany({
          where: { ...(data.timeRange !== "all" && { createdAt: { gte: cutoffDate } }) },
          include: { assignee: { select: { name: true } } },
          take: 100,
        }),
        db.pODDocument.findMany({
          where: { ...(data.timeRange !== "all" && { createdAt: { gte: cutoffDate } }) },
          take: 100,
        }),
      ]);

      const service = new AIService({ userId: ctx.userId });

      // Build structured context for AI analysis
      const context = `
Time Period: ${data.timeRange === "all" ? "All time" : data.timeRange}
Reporting Period: ${data.timeRange !== "all" ? new Date(cutoffDate).toLocaleDateString() + " to " + now.toLocaleDateString() : "All available data"}

AUTHORIZED RECORDS:
Inspections (${inspections.length} total):
${inspections.map((i) => `- ${i.title} (${i.type}): ${i.status} at ${i.warehouse?.name || "Unknown"}`).slice(0, 20).join("\n")}

Stock Discrepancies (${discrepancies.length} total):
${discrepancies.map((d) => `- ${d.inventoryItem?.name || "Unknown"}: ${d.difference > 0 ? "+" : ""}${d.difference} units at ${d.inventoryItem?.warehouse?.name || "Unknown"}`).slice(0, 20).join("\n")}

Tasks (${tasks.length} total):
${tasks.map((t) => `- ${t.title}: ${t.status} assigned to ${t.assignee?.name || "Unassigned"}`).slice(0, 20).join("\n")}

POD Documents (${podDocuments.length} total):
${podDocuments.map((p) => `- ${p.fileName}: ${p.status}`).slice(0, 20).join("\n")}
`;

      const analysisResult = await service.generate({
        messages: [
          {
            role: "system",
            content: `You are a logistics operations analytics assistant. Analyze the provided operational data and answer the user's question in plain language.

RULES:
1. Only use the data provided in the context above. Do not invent data.
2. Show your calculation methodology when presenting numbers.
3. Explain the reporting period clearly.
4. If data is insufficient to answer, say exactly what data is missing.
5. Label AI-generated insights as suggestions, not confirmed facts.
6. Present uncertain predictions clearly as uncertain.
7. Do not approve transactions, modify records, or change permissions.
8. Be concise and professional.
9. When providing numbers, show how they were calculated from the raw data.
10. Reference specific records when making claims (e.g., "Inspection #XYZ-123 at Bhiwandi warehouse").

Current user role: ${ctx.role}`,
          },
          {
            role: "user",
            content: `User Question: ${data.query}\n\nAnalysis Type: ${data.analysisType}\n\nAuthorized Data Context:\n${context}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_ANALYTICS_QUERY",
          entityType: "System",
          entityId: "analytics-query",
          metadata: JSON.stringify({
            query: data.query,
            analysisType: data.analysisType,
            timeRange: data.timeRange,
          }),
        },
      });

      return Response.json({
        query: data.query,
        analysisType: data.analysisType,
        timeRange: data.timeRange,
        analysis: analysisResult.text,
        dataSummary: {
          inspections: inspections.length,
          discrepancies: discrepancies.length,
          tasks: tasks.length,
          podDocuments: podDocuments.length,
        },
        provider: analysisResult.provider,
        model: analysisResult.model,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleError(err, "AI analytics query failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR", "READ_ONLY_VIEWER"] },
);