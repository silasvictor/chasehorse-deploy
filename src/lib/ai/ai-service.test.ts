import { describe, it, expect, vi } from "vitest";
import { AIService } from "@/lib/ai/ai-service";

describe("AI service system prompt (prompt injection safeguards)", () => {
  const service = new AIService({ userId: "u1" });

  it("builds a system prompt that scopes the assistant", () => {
    const prompt = service.buildSystemPrompt({
      userRole: "FIELD_INSPECTOR",
      pendingInspections: 3,
      openDiscrepancies: 1,
      pendingPODs: 2,
      overdueTasks: 0,
      commonQualityIssues: ["high"],
    });

    expect(prompt).toContain("FIELD_INSPECTOR");
    expect(prompt).toContain("Do not invent assignments");
    expect(prompt).toContain("Use only the actual application data");
    expect(prompt).toContain("do not present uncertain predictions as confirmed facts");
  });

  it("limits data sent to AI (data minimization)", () => {
    const prompt = service.buildSystemPrompt({
      userRole: "READ_ONLY_VIEWER",
      pendingInspections: 0,
      openDiscrepancies: 0,
      pendingPODs: 0,
      overdueTasks: 0,
      commonQualityIssues: [],
    });
    // Should not include actual database queries or customer records
    expect(prompt).not.toContain("SELECT");
    expect(prompt).not.toContain("customer data:");
    expect(prompt).not.toContain("financial records:");
  });
});

describe("Provider selection safeguards", () => {
  it("service constructs without throwing when provider not configured", () => {
    // Constructing the service with an unconfigured provider should not throw.
    expect(() => new AIService({ userId: "u1", provider: "openai" })).not.toThrow();
    expect(() => new AIService({ userId: "u1", provider: "anthropic" })).not.toThrow();
    expect(() => new AIService({ userId: "u1", provider: "gemini" })).not.toThrow();
  });
});
