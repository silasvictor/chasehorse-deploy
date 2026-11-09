/**
 * Provider-independent AI integration interface.
 *
 * All AI providers implement this interface so the application can switch
 * providers without rewriting application logic. Provider-specific logic lives
 * in separate adapter modules.
 */

export type AIProviderName = "gemini" | "openai" | "anthropic";

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
  metadata?: Record<string, string>;
}

export interface AIResponse {
  text: string;
  provider: AIProviderName;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

export interface AIProviderStatus {
  provider: AIProviderName;
  configured: boolean;
  available: boolean;
  model: string;
  error?: string;
}

export interface AIProvider {
  name: AIProviderName;
  isConfigured(): boolean;
  isAvailable(): Promise<boolean>;
  generate(request: AIRequest): Promise<AIResponse>;
  generateStream?(request: AIRequest): AsyncGenerator<{ text: string }>;
}

export class AIProviderError extends Error {
  constructor(
    provider: AIProviderName,
    message: string,
    public readonly retryable: boolean = false,
    public readonly statusCode?: number,
  ) {
    super(`[${provider}] ${message}`);
    this.name = "AIProviderError";
  }
}

export class AIProviderNotConfiguredError extends Error {
  constructor(provider: AIProviderName) {
    super(`AI provider "${provider}" is not configured. Set the corresponding API key environment variable.`);
    this.name = "AIProviderNotConfiguredError";
  }
}
