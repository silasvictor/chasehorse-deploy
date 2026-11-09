import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import { AIService } from "@/lib/ai/ai-service";
import {
  extractDocumentText,
  classifyDocument,
  extractFieldsHeuristic,
  detectMissingFields,
  type ExtractionResult,
} from "@/lib/document-intelligence";
import { z } from "zod";

const Schema = z.object({
  documentId: z.string().optional(),
  analysisType: z.enum(["EXTRACT", "CLASSIFY", "MISSING_FIELDS", "SUMMARIZE", "COMPARE"]).default("EXTRACT"),
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
      const contentType = req.headers.get("content-type") || "";
      let buffer: Buffer | null = null;
      let fileName = "document";
      let mimeType = "application/octet-stream";
      let documentId: string | undefined;

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
          return new Response(JSON.stringify({ error: "No file provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        buffer = Buffer.from(await file.arrayBuffer());
        fileName = file.name;
        mimeType = file.type || "application/octet-stream";
      } else {
        const body = await req.json();
        const data = Schema.parse(body);
        documentId = data.documentId;
        if (!documentId) {
          return new Response(JSON.stringify({ error: "documentId or file required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const doc = await db.document.findUnique({ where: { id: documentId } });
        if (!doc) {
          return new Response(JSON.stringify({ error: "Document not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        fileName = doc.originalName;
        mimeType = doc.mimeType;
        // Read from storage
        const fs = await import("fs");
        const path = await import("path");
        const storagePath = process.env.LOCAL_STORAGE_PATH || "./storage/uploads";
        const filePath = path.join(storagePath, doc.storedName);
        buffer = await fs.promises.readFile(filePath);
      }

      if (!buffer) {
        return new Response(JSON.stringify({ error: "Could not read file" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const extracted = await extractDocumentText(buffer, mimeType, fileName);
      const documentType = classifyDocument(extracted.text, fileName);
      const extractedFields = extractFieldsHeuristic(extracted.text, documentType);
      const missingFields = detectMissingFields(documentType, extractedFields);

      let aiSummary: string | null = null;
      const service = new AIService({ userId: ctx.userId });
      try {
        const result = await service.generate({
          messages: [
            {
              role: "system",
              content: `You are a document intelligence assistant. Summarize the extracted document and identify missing information. Do not invent data. Label as draft requiring human approval.`,
            },
            {
              role: "user",
              content: `Document: ${fileName}\nType: ${documentType}\nExtracted text (truncated):\n${extracted.text.slice(0, 6000)}\n\nExtracted fields: ${JSON.stringify(extractedFields)}\nMissing fields: ${missingFields.join(", ") || "none"}`,
            },
          ],
          temperature: 0.2,
          maxTokens: 1200,
        });
        aiSummary = result.text;
      } catch {
        aiSummary = null;
      }

      const result: ExtractionResult & {
        fileName: string;
        mimeType: string;
        size: number;
        extractedTextPreview: string;
        aiSummary: string | null;
        provider: string | null;
        requiresHumanApproval: true;
      } = {
        documentType,
        extractedText: extracted.text,
        extractedFields,
        missingFields,
        confidence: extracted.text.length > 100 ? 0.7 : 0.3,
        requiresHumanApproval: true,
        fileName,
        mimeType,
        size: buffer.length,
        extractedTextPreview: extracted.text.slice(0, 2000),
        aiSummary,
        provider: aiSummary ? "active" : null,
      };

      // Persist extracted data to Document if documentId provided
      if (documentId) {
        try {
          await db.document.update({
            where: { id: documentId },
            data: {
              extractedData: JSON.stringify({ documentType, extractedFields, missingFields }),
              status: "PROCESSING",
            },
          });
        } catch {
          // ignore
        }
      }

      await auditLog(ctx, "AI_DOCUMENT_INTELLIGENCE", "Document", documentId || fileName, {
        documentType,
        missingFields,
      });

      return Response.json(result);
    } catch (err) {
      return handleError(err, "Document intelligence failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);