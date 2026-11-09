/**
 * AI Document Intelligence API Route - POD Compliance Analysis.
 *
 * Provides AI-assisted document processing including:
 * - Extracting relevant fields from POD documents
 * - Identifying missing required fields
 * * Flagging missing or inconsistent documentation
 * - Comparing document fields with authorized delivery records
 * - Identifying potential inconsistencies
 * - Generating structured extraction results
 *
 * Use appropriate parsing, OCR, and model capabilities depending on file type.
 * Require users to review and confirm extracted information before changing records.
 * Never automatically overwrite official business records based solely on AI extraction.
 */

import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { z } from "zod";

const PODComplianceSchema = z.object({
  documentId: z.string().optional(),
  assignmentId: z.string().optional(),
  analysisType: z.enum(["EXTRACT", "COMPLIANCE_CHECK", "MISSING_FIELDS", "INCONSISTENCIES", "SUMMARIZE"]).default("SUMMARIZE"),
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
      const data = PODComplianceSchema.parse(body);

      // Get POD documents - authorized based on role
      const where: any = {};
      if (data.documentId) where.id = data.documentId;
      if (data.assignmentId) where.assignmentId = data.assignmentId;

      const podDocuments = await db.pODDocument.findMany({
        where,
        include: {
          assignment: { select: { id: true, title: true } },
          verifier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      if (podDocuments.length === 0) {
        return new Response(
          JSON.stringify({ error: "No POD documents found matching criteria" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      const service = new AIService({ userId: ctx.userId });

      // Build context from POD documents
      const context = podDocuments.map((doc) => `
Document: ${doc.fileName}
Assignment: ${doc.assignment?.title || "Unknown"}
Status: ${doc.status}
Verified: ${doc.verified ? "Yes" : "No"}
Extracted Data: ${doc.extractedData || "None"}
Uploaded: ${new Date(doc.createdAt).toISOString()}
`).join("\n---\n");

      let analysisResult: string;

      if (data.analysisType === "EXTRACT") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are a document intelligence assistant. Extract relevant fields from POD documents including delivery date, recipient, items delivered, condition, signature status, and delivery address. Return structured extraction results.` },
            { role: "user", content: `Extract fields from these POD documents:\n\n${context}` },
          ],
          temperature: 0.2,
          maxTokens: 2000,
        });
        analysisResult = result.text;
      } else if (data.analysisType === "COMPLIANCE_CHECK") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are a POD compliance analyst. Analyze POD documents for compliance with delivery requirements. Identify missing required fields and flag non-compliant documents. Do not declare documents legally valid without human verification.` },
            { role: "user", content: `Check POD compliance:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else if (data.analysisType === "MISSING_FIELDS") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are a document completeness analyst. Identify missing required fields in POD documents including delivery date, recipient name, items delivered, condition, and signature status.` },
            { role: "user", content: `Identify missing fields in POD documents:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else if (data.analysisType === "INCONSISTENCIES") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are a document consistency analyst. Identify inconsistencies in POD documents including mismatched dates, quantities, or other inconsistent fields.` },
            { role: "user", content: `Identify inconsistencies in POD documents:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are a POD compliance analyst. Summarize POD document status and compliance status.` },
            { role: "user", content: `Summarize POD compliance:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      }

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_POD_COMPLIANCE_ANALYSIS",
          entityType: "PODDocument",
          entityId: data.documentId || "multiple",
          metadata: JSON.stringify({
            analysisType: data.analysisType,
            documentCount: podDocuments.length,
          }),
        },
      });

      return Response.json({
        analysisType: data.analysisType,
        analysis: analysisResult,
        documentsAnalyzed: podDocuments.length,
        pendingCount: podDocuments.filter((p) => p.status === "PENDING").length,
        verifiedCount: podDocuments.filter((p) => p.verified).length,
        provider: "gemini",
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleError(err, "POD compliance analysis failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);