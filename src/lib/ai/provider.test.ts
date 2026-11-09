import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiProvider } from "@/lib/ai/gemini-provider";
import { OpenAIProvider } from "@/lib/ai/openai-provider";
import { AnthropicProvider } from "@/lib/ai/anthropic-provider";
import { AIProviderNotConfiguredError } from "@/lib/ai/provider-interface";
import { getAIConfig, getProviderStatuses } from "@/lib/ai/config";

describe("AI provider configuration", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("gemini provider is not configured without API key", () => {
    process.env.GEMINI_API_KEY = "";
    const p = new GeminiProvider({
      provider: "gemini",
      apiKey: "",
      model: "gemini-1.5-flash-latest",
    });
    expect(p.isConfigured()).toBe(false);
  });

  it("gemini provider is configured with API key", () => {
    const p = new GeminiProvider({
      provider: "gemini",
      apiKey: "test-key",
      model: "gemini-1.5-flash-latest",
    });
    expect(p.isConfigured()).toBe(true);
  });

  it("getProviderStatuses reports configured state without secrets", () => {
    process.env.GEMINI_API_KEY = "key1";
    process.env.OPENAI_API_KEY = "";
    const statuses = getProviderStatuses();
    const gemini = statuses.find((s) => s.provider === "gemini");
    const openai = statuses.find((s) => s.provider === "openai");
    expect(gemini?.configured).toBe(true);
    expect(openai?.configured).toBe(false);
    // No secrets exposed
    expect(JSON.stringify(statuses)).not.toContain("key1");
  });

  it("getAIConfig defaults to gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "k";
    const cfg = getAIConfig();
    expect(cfg.provider).toBe("gemini");
  });

  it("Gemini provider throws AIProviderNotConfiguredError when no key", async () => {
    const p = new GeminiProvider({
      provider: "gemini",
      apiKey: "",
      model: "gemini-1.5-flash-latest",
    });
    await expect(p.generate({ messages: [{ role: "user", content: "hi" }] })).rejects.toBeInstanceOf(
      AIProviderNotConfiguredError,
    );
  });

  it("OpenAI provider throws when not configured", async () => {
    const p = new OpenAIProvider({
      provider: "openai",
      apiKey: "",
      model: "gpt-4o-mini",
    });
    await expect(p.generate({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(
      /not configured/,
    );
  });

  it("Anthropic provider throws when not configured", async () => {
    const p = new AnthropicProvider({
      provider: "anthropic",
      apiKey: "",
      model: "claude-3-haiku-20240307",
    });
    await expect(p.generate({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(
      /not configured/,
    );
  });
});

describe("AI response parsing", () => {
  it("Gemini provider parses a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Hello from Gemini" }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
      }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const p = new GeminiProvider({
      provider: "gemini",
      apiKey: "test-key",
      model: "gemini-1.5-flash-latest",
    });
    const res = await p.generate({ messages: [{ role: "user", content: "hi" }] });

    expect(res.text).toBe("Hello from Gemini");
    expect(res.provider).toBe("gemini");
    expect(res.usage?.totalTokens).toBe(15);

    vi.unstubAllGlobals();
  });

  it("Gemini provider handles API error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "invalid api key",
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const p = new GeminiProvider({
      provider: "gemini",
      apiKey: "bad-key",
      model: "gemini-1.5-flash-latest",
    });
    await expect(
      p.generate({ messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toThrow(/401/);

    vi.unstubAllGlobals();
  });
});
