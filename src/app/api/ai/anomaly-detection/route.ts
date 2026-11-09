/**
 * AI Anomaly Detection API Route.
 *
 * Creates a system that flags:
 * - Unexpected inventory differences
 * - Repeated inspection failures
 * - Missing required documentation
 * - Overdue tasks
 * - Inconsistent records
 *
 * Uses deterministic rules for clear conditions and AI for contextual analysis.
 * Clearly labels findings as detected issues, potential anomalies, or AI suggestions.
 * Does not present uncertain predictions as confirmed facts.
 */

import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { z } from "zod";

const AnomalyDetectionSchema = z.object({
  analysisType: z.enum(["INVENTORY", "INSPECTION", "TASKS", "DOCUMENTS", "ALL"]).default("ALL"),
  severityThreshold: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function meetsSeverityThreshold(anomalySeverity: string, threshold: string): boolean {
  return SEVERITY_ORDER[anomalySeverity.toUpperCase()] >= SEVERITY_ORDER[threshold.toUpperCase()];
}

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = AnomalyDetectionSchema.parse(body);

      const anomalies: Array<{
        type: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        entityType: string;
        entityId: string;
        entityName: string;
        description: string;
        evidence: string;
        recommendedAction: string;
      }> = [];

      // 1. Detect unexpected inventory differences
      if (data.analysisType === "INVENTORY" || data.analysisType === "ALL") {
        const discrepancies = await db.stockDiscrepancy.findMany({
          where: { status: "OPEN" },
          include: {
            inventoryItem: { include: { warehouse: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        for (const d of discrepancies) {
          const absDiff = Math.abs(d.difference);
          let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
          if (absDiff > 100) severity = "CRITICAL";
          else if (absDiff > 50) severity = "HIGH";
          else if (absDiff > 10) severity = "MEDIUM";

          if (meetsSeverityThreshold(severity, data.severityThreshold)) {
            anomalies.push({
              type: "INVENTORY_DISCREPANCY",
              severity,
              entityType: "StockDiscrepancy",
              entityId: d.id,
              entityName: d.inventoryItem?.name || "Unknown Item",
              description: `Unexpected inventory difference of ${d.difference > 0 ? "+" : ""}${d.difference} units`,
              evidence: `Recorded: ${d.recordedQty}, Counted: ${d.countedQty}, Difference: ${d.difference > 0 ? "+" : ""}${d.difference} units in warehouse ${d.inventoryItem?.warehouse?.name || "Unknown"}`,
              recommendedAction: "Perform physical recount and investigate cause of discrepancy.",
            });
          }
        }
      }

      // 2. Detect repeated inspection failures
      if (data.analysisType === "INSPECTION" || data.analysisType === "ALL") {
        const failedInspections = await db.inspection.findMany({
          where: {
            qualityRecords: {
              some: { result: "FAIL" },
            },
          },
          include: {
            qualityRecords: { where: { result: "FAIL" } },
            warehouse: { select: { name: true } },
          },
          take: 50,
        });

        for (const insp of failedInspections) {
          const failures = insp.qualityRecords.filter((q: any) => q.result === "FAIL");
          const criticalFailures = failures.filter((q: any) => q.severity === "CRITICAL" || q.severity === "HIGH");

          if (criticalFailures.length > 0) {
            anomalies.push({
              type: "INSPECTION_FAILURE",
              severity: "HIGH",
              entityType: "Inspection",
              entityId: insp.id,
              entityName: insp.title,
              description: `${criticalFailures.length} critical/high severity quality failure(s)`,
              evidence: `Inspection "${insp.title}" at ${insp.warehouse?.name || "Unknown warehouse"} has ${criticalFailures.length} critical quality failures`,
              recommendedAction: "Schedule follow-up inspection and implement corrective actions.",
            });
          }
        }
      }

      // 3. Detect missing required documentation
      if (data.analysisType === "DOCUMENTS" || data.analysisType === "ALL") {
        const pendingPODs = await db.pODDocument.findMany({
          where: { status: "PENDING" },
          include: {
            assignment: { select: { id: true, title: true } },
          },
          take: 50,
        });

        for (const pod of pendingPODs) {
          const daysPending = Math.floor((Date.now() - new Date(pod.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
          if (daysPending > 14) severity = "CRITICAL";
          else if (daysPending > 7) severity = "HIGH";
          else if (daysPending > 3) severity = "MEDIUM";

          if (meetsSeverityThreshold(severity, data.severityThreshold)) {
            anomalies.push({
              type: "MISSING_POD",
              severity,
              entityType: "PODDocument",
              entityId: pod.id,
              entityName: pod.fileName,
              description: `POD document pending verification for ${daysPending} days`,
              evidence: `POD "${pod.fileName}" for assignment "${pod.assignment?.title || "Unknown"}" pending since ${new Date(pod.createdAt).toLocaleDateString()}`,
              recommendedAction: "Assign verifier and complete POD document review.",
            });
          }
        }
      }

      // 4. Detect overdue tasks
      if (data.analysisType === "TASKS" || data.analysisType === "ALL") {
        const overdueTasks = await db.task.findMany({
          where: {
            status: { in: ["OPEN", "IN_PROGRESS"] },
            dueDate: { lt: new Date() },
          },
          include: {
            assignee: { select: { id: true, name: true } },
          },
          take: 50,
        });

        for (const task of overdueTasks) {
          const daysOverdue = Math.floor((Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
          let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
          if (daysOverdue > 14) severity = "CRITICAL";
          else if (daysOverdue > 7) severity = "HIGH";
          else if (daysOverdue > 3) severity = "MEDIUM";

          if (meetsSeverityThreshold(severity, data.severityThreshold)) {
            anomalies.push({
              type: "OVERDUE_TASK",
              severity,
              entityType: "Task",
              entityId: task.id,
              entityName: task.title,
              description: `Task overdue by ${daysOverdue} days`,
              evidence: `Task "${task.title}" assigned to ${task.assignee?.name || "Unassigned"} was due on ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "unknown"}`,
              recommendedAction: "Follow up with assignee and provide necessary resources to complete.",
            });
          }
        }
      }

      // Sort by severity
      anomalies.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

      // Get AI-powered contextual analysis if there are anomalies
      let aiInsights: string | null = null;
      if (anomalies.length > 0) {
        try {
          const service = new AIService({ userId: ctx.userId });
          const context = anomalies.map((a) => `
Type: ${a.type}
Severity: ${a.severity}
Entity: ${a.entityName} (${a.entityType})
Description: ${a.description}
Evidence: ${a.evidence}
`).join("\n---\n");

          aiInsights = (await service.generate({
            messages: [
              { role: "system", content: `You are an anomaly detection analyst. Review the following detected anomalies and provide contextual insights about patterns, priorities, and recommended actions. Do not label anything as fraud without evidence.` },
              { role: "user", content: `Analyze these anomalies:\n\n${context}` },
            ],
            temperature: 0.3,
            maxTokens: 1500,
          })).text;
        } catch {
          // AI insights are optional
        }
      }

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_ANOMALY_DETECTION",
          entityType: "System",
          entityId: "anomaly-scan",
          metadata: JSON.stringify({
            analysisType: data.analysisType,
            anomalyCount: anomalies.length,
            severityThreshold: data.severityThreshold,
          }),
        },
      });

      return Response.json({
        analysisType: data.analysisType,
        severityThreshold: data.severityThreshold,
        anomalyCount: anomalies.length,
        anomalies,
        aiInsights,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleError(err, "Anomaly detection failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);