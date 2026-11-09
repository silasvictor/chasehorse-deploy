/**
 * Provider factory.
 *
 * Instantiates the configured AI provider adapter. Returns null when no
 * provider is configured so the rest of the application can degrade gracefully.
 */

import type { AIProvider, AIProviderName } from "./provider-interface";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { getAIConfig, type AIProviderEnvConfig } from "./config";

export function createProvider(config?: AIProviderEnvConfig): AIProvider | null {
  const cfg = config ?? getAIConfig();

  switch (cfg.provider) {
    case "gemini":
      return new GeminiProvider({
        provider: "gemini",
        apiKey: cfg.apiKey,
        model: cfg.model,
        timeoutMs: cfg.timeoutMs,
        maxRetries: cfg.maxRetries,
      });
    case "openai":
      return new OpenAIProvider({
        provider: "openai",
        apiKey: cfg.apiKey,
        model: cfg.model,
        timeoutMs: cfg.timeoutMs,
        maxRetries: cfg.maxRetries,
      });
    case "anthropic":
      return new AnthropicProvider({
        provider: "anthropic",
        apiKey: cfg.apiKey,
        model: cfg.model,
        timeoutMs: cfg.timeoutMs,
        maxRetries: cfg.maxRetries,
      });
    default:
      return null;
  }
}

export function getActiveProviderName(): AIProviderName | null {
  try {
    return getAIConfig().provider;
  } catch {
    return null;
  }
}
