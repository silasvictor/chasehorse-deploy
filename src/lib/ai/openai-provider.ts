/**
 * OpenAI AI provider adapter.
 *
 * Communicates with the OpenAI Chat Completions API via server-side fetch.
 * API keys are never exposed to the browser.
 */

import type { AIProvider, AIProviderConfig, AIRequest, AIResponse } from "./provider-interface";

export class OpenAIProvider implements AIProvider {
  public readonly name: "openai" = "openai";
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
      throw new Error('AI provider "openai" is not configured. Set OPENAI_API_KEY.');
    }

    const model = this.config.model || "gpt-4o-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    const messages = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: unknown = {
      model,
      messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 1024,
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
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(
            `OpenAI API request failed (${res.status}): ${errBody.slice(0, 300)}`,
          );
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          error?: unknown;
        };

        if (data.error) {
          throw new Error(`OpenAI API error: ${JSON.stringify(data.error)}`);
        }

        const text = data.choices?.[0]?.message?.content ?? "";

        return {
          text,
          provider: "openai",
          model,
          usage: data.usage
            ? {
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
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
      : new Error("OpenAI request failed after retries");
  }
}
