/**
 * Google Gemini AI provider adapter.
 *
 * Communicates with the Gemini API via server-side fetch. API keys are never
 * exposed to the browser. All requests go through Next.js API routes.
 */

import type {
  AIProvider,
  AIProviderConfig,
  AIRequest,
  AIResponse,
  AIProviderStatus,
} from "./provider-interface";
import { AIProviderError, AIProviderNotConfiguredError } from "./provider-interface";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiProvider implements AIProvider {
  public readonly name: "gemini" = "gemini";
  private readonly config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await this.generate({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new AIProviderNotConfiguredError("gemini");
    }

    const model = this.config.model || "gemini-1.5-flash-latest";
    const url = `${BASE_URL}/models/${model}:generateContent?key=${this.config.apiKey}`;

    const systemMessages = request.messages.filter((m) => m.role === "system");
    const conversationMessages = request.messages.filter((m) => m.role !== "system");

    const contents = conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: unknown = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.3,
        maxOutputTokens: request.maxTokens ?? 1024,
      },
      ...(systemMessages.length > 0
        ? {
            systemInstruction: {
              parts: [{ text: systemMessages.map((m) => m.content).join("\n") }],
            },
          }
        : {}),
    };

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= (this.config.maxRetries ?? 2); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new AIProviderError(
            "gemini",
            `Gemini API request failed (${res.status}): ${errBody.slice(0, 300)}`,
            res.status >= 500,
            res.status,
          );
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
          };
          error?: unknown;
        };

        if (data.error) {
          throw new AIProviderError("gemini", `Gemini API error: ${JSON.stringify(data.error)}`);
        }

        const text =
          data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

        return {
          text,
          provider: "gemini",
          model,
          usage: data.usageMetadata
            ? {
                inputTokens: data.usageMetadata.promptTokenCount,
                outputTokens: data.usageMetadata.candidatesTokenCount,
                totalTokens: data.usageMetadata.totalTokenCount,
              }
            : undefined,
          raw: data,
        };
      } catch (err) {
        lastError = err;
        if (err instanceof AIProviderError && !err.retryable) throw err;
        if (attempt === (this.config.maxRetries ?? 2)) break;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new AIProviderError("gemini", "Gemini request failed after retries");
  }
}

export function geminiProviderStatus(config: AIProviderConfig): AIProviderStatus {
  return {
    provider: "gemini",
    configured: Boolean(config.apiKey),
    available: false, // populated async by the factory/service
    model: config.model,
  };
}
