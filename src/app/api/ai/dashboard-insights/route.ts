/**
 * AI Dashboard Insights API Route.
 *
 * Enhances the existing dashboard with AI-generated operational summaries,
 * important pending issues, inspection trends, inventory discrepancy insights,
 * POD compliance summaries, overdue task insights, and suggested operational actions.
 *
 * Add a clearly labeled AI Insights section.
 * Allow users to refresh insights.
 * Avoid generating duplicate or misleading notifications.
 */

import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { z } from "zod";

const DashboardInsightsSchema = z.object({
  focusAreas: z.array(z.enum(["INSPECTIONS", "INVENTORY", "TASKS", "DOCUMENTS", "ALL"])).default(["ALL"]),
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
      const data = DashboardInsightsSchema.parse(body);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get dashboard metrics
      const [
        pendingInspections,
        completedInspections,
        openDiscrepancies,
        resolvedDiscrepancies,
        pendingPODs,
        verifiedPODs,
        openTasks,
        completedTasks,
        lowStockItems,
      ] = await Promise.all([
        db.inspection.count({ where: { status: "SCHEDULED" } }),
        db.inspection.count({ where: { status: "COMPLETED" } }),
        db.stockDiscrepancy.count({ where: { status: "OPEN" } }),
        db.stockDiscrepancy.count({ where: { status: "RESOLVED" } }),
        db.pODDocument.count({ where: { status: "PENDING" } }),
        db.pODDocument.count({ where: { verified: true } }),
        db.task.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
        db.task.count({ where: { status: "COMPLETED" } }),
        (async () => {
          const items = await db.inventoryItem.findMany({});
          return items.filter((i: any) => (i.quantity ?? 0) <= (i.minThreshold ?? 0)).length;
        })(),
      ]);

      const service = new AIService({ userId: ctx.userId });

      // Build contextual summary
      const context = `
Dashboard Metrics (as of ${now.toLocaleDateString()}):
- Pending Inspections: ${pendingInspections}
- Completed Inspections: ${completedInspections}
- Open Stock Discrepancies: ${openDiscrepancies}
- Resolved Discrepancies: ${resolvedDiscrepancies}
- Pending POD Documents: ${pendingPODs}
- Verified POD Documents: ${verifiedPODs}
- Open Tasks: ${openTasks}
- Completed Tasks: ${completedTasks}
- Low Stock Items: ${lowStockItems}
`;

      const analysisResult = await service.generate({
        messages: [
          {
            role: "system",
            content: `You are an operations dashboard insights analyst. Provide a concise executive summary of the operational dashboard metrics. Highlight:
1. Key operational highlights
2. Items requiring immediate attention
3. Trends or patterns
4. Recommended actions

Be concise, professional, and focus on actionable insights.`,
          },
          { role: "user", content: `Generate AI insights for this dashboard:\n\n${context}` },
        ],
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Build insights array
      const insights: Array<{
        type: "inspection" | "discrepancy" | "pod" | "task" | "inventory" | "general";
        severity: "low" | "medium" | "high" | "critical";
        title: string;
        description: string;
        actionUrl: string;
        count: number;
      }> = [];

      if (openDiscrepancies > 0) {
        insights.push({
          type: "discrepancy",
          severity: openDiscrepancies > 5 ? "high" : openDiscrepancies > 2 ? "medium" : "low",
          title: "Open Stock Discrepancies",
          description: `${openDiscrepancies} inventory count discrepancy(ies) require investigation.`,
          actionUrl: "/dashboard/discrepancies",
          count: openDiscrepancies,
        });
      }

      if (pendingPODs > 0) {
        insights.push({
          type: "pod",
          severity: pendingPODs > 5 ? "high" : pendingPODs > 2 ? "medium" : "low",
          title: "Pending POD Documents",
          description: `${pendingPODs} proof-of-delivery document(s) awaiting verification.`,
          actionUrl: "/dashboard/documents",
          count: pendingPODs,
        });
      }

      if (openTasks > 0) {
        insights.push({
          type: "task",
          severity: openTasks > 10 ? "high" : openTasks > 5 ? "medium" : "low",
          title: "Open Tasks",
          description: `${openTasks} task(s) are currently open or in progress.`,
          actionUrl: "/dashboard/tasks",
          count: openTasks,
        });
      }

      if (pendingInspections > 0) {
        insights.push({
          type: "inspection",
          severity: pendingInspections > 5 ? "high" : pendingInspections > 2 ? "medium" : "low",
          title: "Pending Inspections",
          description: `${pendingInspections} inspection(s) are scheduled but not yet started.`,
          actionUrl: "/dashboard/inspections",
          count: pendingInspections,
        });
      }

      if (lowStockItems > 0) {
        insights.push({
          type: "inventory",
          severity: lowStockItems > 10 ? "high" : lowStockItems > 3 ? "medium" : "low",
          title: "Low Stock Items",
          description: `${lowStockItems} item(s) are at or below minimum threshold.`,
          actionUrl: "/dashboard/inventory",
          count: lowStockItems,
        });
      }

      // Sort by severity
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      insights.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_DASHBOARD_INSIGHTS",
          entityType: "Dashboard",
          entityId: "overview",
          metadata: JSON.stringify({
            focusAreas: data.focusAreas,
            insightCount: insights.length,
          }),
        },
      });

      return Response.json({
        generatedAt: new Date().toISOString(),
        aiInsights: analysisResult.text,
        insights,
        metrics: {
          pendingInspections,
          completedInspections,
          openDiscrepancies,
          resolvedDiscrepancies,
          pendingPODs,
          verifiedPODs,
          openTasks,
          completedTasks,
          lowStockItems,
        },
        provider: analysisResult.provider,
        model: analysisResult.model,
      });
    } catch (err) {
      return handleError(err, "AI dashboard insights generation failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR", "READ_ONLY_VIEWER"] },
);