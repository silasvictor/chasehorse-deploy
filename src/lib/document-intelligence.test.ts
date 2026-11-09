import { describe, it, expect } from "vitest";
import { extractDocumentText, classifyDocument, extractFieldsHeuristic } from "./document-intelligence";

describe("document intelligence", () => {
  it("extracts csv text", async () => {
    const buf = Buffer.from("name,qty\nWidget,5");
    const res = await extractDocumentText(buf, "text/csv", "inventory.csv");
    expect(res.text).toContain("Widget");
  });

  it("classifies pod", () => {
    expect(classifyDocument("Proof of delivery document", "pod.pdf")).toBe("POD");
  });

  it("extracts key:value fields", () => {
    const fields = extractFieldsHeuristic("DeliveryDate: 2026-01-01\nRecipient: John", "POD");
    expect(fields.DeliveryDate).toBe("2026-01-01");
  });
});