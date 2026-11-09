/**
 * AI provider configuration.
 *
 * Reads from environment variables. The application starts even if no AI
 * provider is configured; the assistant shows an informative setup message.
 */

import { db } from "@/lib/db";

export type AIProviderName = "gemini" | "openai" | "anthropic";

export interface AIProviderEnvConfig {
  provider: AIProviderName;
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
}

function getEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value !== undefined && value !== "" ? value : fallback;
}

export function getAIConfig(): AIProviderEnvConfig {
  const provider = (getEnv("AI_PROVIDER", "gemini") as AIProviderName) ?? "gemini";

  let apiKey = "";
  let model = "";

  switch (provider) {
    case "gemini":
      apiKey = getEnv("GEMINI_API_KEY", "");
      model = getEnv("GEMINI_MODEL", "gemini-1.5-flash-latest");
      break;
    case "openai":
      apiKey = getEnv("OPENAI_API_KEY", "");
      model = getEnv("OPENAI_MODEL", "gpt-4o-mini");
      break;
    case "anthropic":
      apiKey = getEnv("ANTHROPIC_API_KEY", "");
      model = getEnv("ANTHROPIC_MODEL", "claude-3-haiku-20240307");
      break;
  }

  return {
    provider,
    apiKey,
    model,
    timeoutMs: Number(getEnv("AI_REQUEST_TIMEOUT_MS", "30000")) || 30000,
    maxRetries: Number(getEnv("AI_MAX_RETRIES", "2")) || 2,
  };
}

export function getProviderStatuses(): Array<{
  provider: AIProviderName;
  configured: boolean;
  model: string;
}> {
  return [
    {
      provider: "gemini",
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: getEnv("GEMINI_MODEL", "gemini-1.5-flash-latest"),
    },
    {
      provider: "openai",
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: getEnv("OPENAI_MODEL", "gpt-4o-mini"),
    },
    {
      provider: "anthropic",
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      model: getEnv("ANTHROPIC_MODEL", "claude-3-haiku-20240307"),
    },
  ];
}

export function getAIConfigForProvider(
  provider: AIProviderName,
  model?: string,
): AIProviderEnvConfig {
  let apiKey = "";
  let resolvedModel = model || "";
  switch (provider) {
    case "gemini":
      apiKey = getEnv("GEMINI_API_KEY", "");
      resolvedModel = resolvedModel || getEnv("GEMINI_MODEL", "gemini-1.5-flash-latest");
      break;
    case "openai":
      apiKey = getEnv("OPENAI_API_KEY", "");
      resolvedModel = resolvedModel || getEnv("OPENAI_MODEL", "gpt-4o-mini");
      break;
    case "anthropic":
      apiKey = getEnv("ANTHROPIC_API_KEY", "");
      resolvedModel = resolvedModel || getEnv("ANTHROPIC_MODEL", "claude-3-haiku-20240307");
      break;
  }
  return {
    provider,
    apiKey,
    model: resolvedModel,
    timeoutMs: Number(getEnv("AI_REQUEST_TIMEOUT_MS", "30000")) || 30000,
    maxRetries: Number(getEnv("AI_MAX_RETRIES", "2")) || 2,
  };
}

export async function getActiveAIConfig(): Promise<AIProviderEnvConfig> {
  const base = getAIConfig();
  try {
    const providerSetting = await db.systemSetting.findUnique({ where: { key: "ai_provider" } });
    const modelSetting = await db.systemSetting.findUnique({ where: { key: "ai_model" } });
    const provider = (providerSetting?.value as AIProviderName) || base.provider;
    const cfg = getAIConfigForProvider(provider, modelSetting?.value || undefined);
    // Fall back to env model if DB model empty
    if (!cfg.model) cfg.model = base.model;
    return cfg;
  } catch {
    return base;
  }
}
