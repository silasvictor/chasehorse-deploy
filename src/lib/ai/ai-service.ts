/**
 * AI service layer.
 *
 * Coordinates provider selection, builds context-aware prompts from authorized
 * application data, and returns structured responses. All provider interaction
 * happens server-side; no API keys reach the browser.
 */

import type {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderName,
  AIProviderStatus,
} from "./provider-interface";
import { createProvider, getActiveProviderName } from "./provider-factory";
import { getAIConfig, getActiveAIConfig, getAIConfigForProvider, getProviderStatuses } from "./config";
import { db } from "@/lib/db";
import { wrapUserInput, buildGuardedSystemPrompt } from "./prompt-guard";

export interface AIServiceOptions {
  userId?: string;
  provider?: AIProviderName;
  model?: string;
}

export interface AIServiceResult {
  text: string;
  provider: string;
  model: string;
  usage?: AIResponse["usage"];
}

export class AIService {
  private readonly defaultOptions: AIServiceOptions;

  constructor(options: AIServiceOptions = {}) {
    this.defaultOptions = options;
  }

  /**
   * Returns configuration status for every provider without revealing secrets.
   */
  getProviderStatuses(): AIProviderStatus[] {
    return getProviderStatuses().map((s) => ({
      provider: s.provider,
      configured: s.configured,
      available: false,
      model: s.model,
    }));
  }

  /**
   * Checks whether the active provider is configured and reachable.
   */
  async isActiveProviderAvailable(): Promise<boolean> {
    const opts = this.defaultOptions;
    try {
      const cfg = opts.provider
        ? getAIConfigForProvider(opts.provider, opts.model)
        : await getActiveAIConfig();
      const provider = createProvider(cfg);
      if (!provider || !provider.isConfigured()) return false;
      return provider.isAvailable();
    } catch {
      return false;
    }
  }

  private async resolveConfig(options: AIServiceOptions = {}): Promise<import("./config").AIProviderEnvConfig> {
    const providerName = options.provider || this.defaultOptions.provider;
    const model = options.model || this.defaultOptions.model;
    if (providerName) {
      return getAIConfigForProvider(providerName, model);
    }
    const cfg = await getActiveAIConfig();
    if (model) cfg.model = model;
    return cfg;
  }

  /**
   * Generates a non-streaming AI response.
   */
  async generate(request: AIRequest, options: AIServiceOptions = {}): Promise<AIServiceResult> {
    const cfg = await this.resolveConfig({ ...this.defaultOptions, ...options });
    const provider = createProvider(cfg);
    if (!provider || !provider.isConfigured()) {
      return {
        text: "",
        provider: "none",
        model: "none",
      };
    }

    const model = options.model || this.defaultOptions.model || cfg.model;
    const guardedMessages = request.messages.map((m) => {
      if (m.role === "user") {
        return { ...m, content: wrapUserInput(m.content) };
      }
      if (m.role === "system") {
        return { ...m, content: buildGuardedSystemPrompt(m.content) };
      }
      return m;
    });
    const response = await provider.generate({ ...request, messages: guardedMessages, model });

    return {
      text: response.text,
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    };
  }

  /**
   * Generates a streaming AI response if the provider supports it.
   */
  async *generateStream(
    request: AIRequest,
    options: AIServiceOptions = {},
  ): AsyncGenerator<{ text: string; done: boolean }> {
    const cfg = await this.resolveConfig({ ...this.defaultOptions, ...options });
    const provider = createProvider(cfg);
    if (!provider || !provider.isConfigured()) {
      yield { text: "", done: true };
      return;
    }

    if (typeof provider.generateStream === "function") {
      for await (const chunk of provider.generateStream(request)) {
        yield { text: chunk.text, done: false };
      }
      yield { text: "", done: true };
      return;
    }

    // Fallback: buffer the full response then yield it once.
    const result = await this.generate(request, options);
    yield { text: result.text, done: true };
  }

  /**
   * Builds a system prompt that scopes the assistant to authorized data.
   */
  buildSystemPrompt(context: {
    userRole: string;
    pendingInspections?: number;
    openDiscrepancies?: number;
    pendingPODs?: number;
    overdueTasks?: number;
    commonQualityIssues?: string[];
  }): string {
    return `You are the ChaseHorse Deploy AI Operations Assistant.

Role: Help logistics operations users understand workflows, interpret records they are authorized to access, and analyze operational information.

Scope rules:
- Only discuss logistics operations, inspections, inventory, assignments, POD documents, quality, and reporting within ChaseHorse Deploy.
- Use only the actual application data provided in the conversation context. Do not invent assignments, inventory quantities, customers, inspection results, or business metrics.
- If requested information is unavailable, explain exactly what data is missing.
- Do not approve financial transactions, modify verified records, change permissions, or send official alerts.
- Label AI-generated suggestions clearly; do not present uncertain predictions as confirmed facts.

Current user role: ${context.userRole}
Authorized data snapshot:
- Pending inspections: ${context.pendingInspections ?? "unknown"}
- Open stock discrepancies: ${context.openDiscrepancies ?? "unknown"}
- Pending POD documents: ${context.pendingPODs ?? "unknown"}
- Overdue tasks: ${context.overdueTasks ?? "unknown"}
- Common quality issues: ${context.commonQualityIssues?.join(", ") ?? "none recorded"}

Answer concisely and helpfully. If you cannot answer from available data, say so.`;
  }

}

export function getConfiguredProviderName(): AIProviderName | null {
  return getActiveProviderName();
}
