/**
 * Document intelligence helpers.
 *
 * Extracts text/content from supported file types. All processing is server-side.
 * Uploaded documents are treated as untrusted input.
 */

export interface ExtractedDocument {
  text: string;
  metadata?: Record<string, unknown>;
  pageCount?: number;
  sheetNames?: string[];
}

export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractedDocument> {
  const lower = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();

  // Plain text / CSV
  if (
    mime.startsWith("text/") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".json")
  ) {
    return { text: buffer.toString("utf-8"), metadata: { type: "text" } };
  }

  // PDF
  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const pdfParseModule: any = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(buffer);
      return {
        text: data.text || "",
        pageCount: data.numpages,
        metadata: { info: data.info },
      };
    } catch (err) {
      return { text: "", metadata: { error: String(err) } };
    }
  }

  // DOCX
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value || "", metadata: { messages: result.messages } };
    } catch (err) {
      return { text: "", metadata: { error: String(err) } };
    }
  }

  // DOC (legacy) - best effort as text
  if (mime === "application/msword" || lower.endsWith(".doc")) {
    return { text: buffer.toString("utf-8"), metadata: { type: "legacy-doc-best-effort" } };
  }

  // XLSX / XLS
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls")
  ) {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheetNames: string[] = [];
      const parts: string[] = [];
      workbook.eachSheet((sheet) => {
        sheetNames.push(sheet.name);
        const rows: string[] = [];
        sheet.eachRow((row) => {
          rows.push((row.values as any[]).slice(1).map((v) => (v == null ? "" : String(v))).join(","));
        });
        parts.push(`## Sheet: ${sheet.name}\n${rows.join("\n")}`);
      });
      return { text: parts.join("\n\n"), sheetNames, metadata: { type: "spreadsheet" } };
    } catch (err) {
      return { text: "", metadata: { error: String(err) } };
    }
  }

  // Images (OCR)
  if (mime.startsWith("image/") || /\.(png|jpe?g|tiff?|webp)$/i.test(lower)) {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      return { text: data.text || "", metadata: { confidence: data.confidence } };
    } catch (err) {
      return { text: "", metadata: { error: String(err) } };
    }
  }

  return { text: "", metadata: { error: "Unsupported file type" } };
}

export function classifyDocument(text: string, fileName: string): string {
  const lower = (text + " " + fileName).toLowerCase();
  if (lower.includes("proof of delivery") || lower.includes("pod")) return "POD";
  if (lower.includes("inspection")) return "INSPECTION_REPORT";
  if (lower.includes("inventory") || lower.includes("stock")) return "INVENTORY_RECORD";
  if (lower.includes("invoice")) return "INVOICE";
  if (lower.includes("checklist")) return "CHECKLIST";
  if (lower.includes("quality")) return "QUALITY_RECORD";
  return "GENERAL_DOCUMENT";
}

export interface ExtractionResult {
  documentType: string;
  extractedText: string;
  extractedFields: Record<string, string | null>;
  missingFields: string[];
  confidence: number;
  requiresHumanApproval: boolean;
}

const POD_REQUIRED_FIELDS = ["deliveryDate", "recipientName", "itemsDelivered", "condition", "signatureStatus"];

export function detectMissingFields(documentType: string, fields: Record<string, string | null>): string[] {
  const required = documentType === "POD" ? POD_REQUIRED_FIELDS : [];
  return required.filter((f) => !fields[f]);
}

export function extractFieldsHeuristic(text: string, documentType: string): Record<string, string | null> {
  const fields: Record<string, string | null> = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Generic key:value extraction
  for (const line of lines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]{2,40})\s*[:=]\s*(.+)$/);
    if (m) {
      const key = m[1].trim().replace(/\s+/g, "");
      fields[key] = m[2].trim();
    }
  }

  // POD-specific
  if (documentType === "POD") {
    const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    fields.deliveryDate = fields.deliveryDate || (dateMatch ? dateMatch[1] : null);
    if (!fields.recipientName) {
      const r = text.match(/recipient\s*[:=]\s*(.+)/i);
      fields.recipientName = r ? r[1].trim() : null;
    }
    if (!fields.signatureStatus) {
      fields.signatureStatus = /signature/i.test(text) ? "Present" : null;
    }
  }

  return fields;
}