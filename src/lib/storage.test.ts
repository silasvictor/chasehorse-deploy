import { describe, it, expect } from "vitest";
import { StorageService } from "@/lib/storage";

describe("Document upload restrictions", () => {
  const storage = new StorageService({
    provider: "local",
    localPath: "./storage/test-uploads",
    maxUploadSizeBytes: 1024 * 1024, // 1 MB
    allowedMimeTypes: ["application/pdf", "image/png"],
    allowedExtensions: [".pdf", ".png"],
  });

  it("rejects disallowed file extension", () => {
    const result = storage.validateFile({
      name: "document.exe",
      size: 100,
      type: "application/octet-stream",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("extension");
  });

  it("rejects disallowed MIME type", () => {
    const result = storage.validateFile({
      name: "document.pdf",
      size: 100,
      type: "text/html",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("MIME");
  });

  it("rejects oversized file", () => {
    const result = storage.validateFile({
      name: "big.pdf",
      size: 1024 * 1024 * 10, // 10 MB
      type: "application/pdf",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("size");
  });

  it("rejects empty file", () => {
    const result = storage.validateFile({
      name: "empty.pdf",
      size: 0,
      type: "application/pdf",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Empty");
  });

  it("accepts valid PDF file", () => {
    const result = storage.validateFile({
      name: "document.pdf",
      size: 100,
      type: "application/pdf",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts valid PNG file", () => {
    const result = storage.validateFile({
      name: "image.png",
      size: 100,
      type: "image/png",
    });
    expect(result.ok).toBe(true);
  });
});
