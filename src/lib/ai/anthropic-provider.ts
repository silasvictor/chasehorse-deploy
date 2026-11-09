/**
 * Anthropic AI provider adapter.
 *
 * Communicates with the Anthropic Messages API via server-side fetch.
 * API keys are never exposed to the browser.
 */

import type { AIProvider, AIProviderConfig, AIRequest, AIResponse } from "./provider-interface";

export class AnthropicProvider implements AIProvider {
  public readonly name: "anthropic" = "anthropic";
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
      throw new Error(
        'AI provider "anthropic" is not configured. Set ANTHROPIC_API_KEY.',
      );
    }

    const model = this.config.model || "claude-3-haiku-20240307";
    const url = "https://api.anthropic.com/v1/messages";

    // Anthropic expects a top-level system message separate from the conversation.
    const systemMessages = request.messages.filter((m) => m.role === "system");
    const conversationMessages = request.messages.filter((m) => m.role !== "system");

    const body: unknown = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.3,
      system: systemMessages.map((m) => m.content).join("\n") || undefined,
      messages: conversationMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      stream: false,
    };

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= (this.config.maxRetries ?? 2); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30000);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(
            `Anthropic API request failed (${res.status}): ${errBody.slice(0, 300)}`,
          );
        }

        const data = (await res.json()) as {
          content?: Array<{ type?: string; text?: string }>;
          usage?: { input_tokens?: number; output_tokens?: number };
          error?: unknown;
        };

        if (data.error) {
          throw new Error(`Anthropic API error: ${JSON.stringify(data.error)}`);
        }

        const text = data.content?.map((c) => c.text ?? "").join("") ?? "";

        return {
          text,
          provider: "anthropic",
          model,
          usage: data.usage
            ? {
                inputTokens: data.usage.input_tokens,
                outputTokens: data.usage.output_tokens,
                totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
              }
            : undefined,
          raw: data,
        };
      } catch (err) {
        lastError = err;
        if (attempt === (this.config.maxRetries ?? 2)) break;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Anthropic request failed after retries");
  }
}
