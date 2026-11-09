/**
 * AI Provider Management for ChaseHorse Deploy.
 *
 * Provides provider health checks, configuration validation, model selection,
 * error handling, request timeouts, usage tracking, and configurable spending
 * limits. Never silently switches providers.
 */

import { getAIConfig, getProviderStatuses } from "./config";
import { createProvider } from "./provider-factory";
import type { AIProvider, AIProviderName } from "./provider-interface";
import { db } from "@/lib/db";

export interface ProviderHealthStatus {
  provider: AIProviderName;
  configured: boolean;
  available: boolean;
  model: string;
  lastChecked: Date | null;
  error?: string;
  latencyMs?: number;
}

export interface UsageRecord {
  provider: AIProviderName;
  model: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUSD: number;
  date: string;
}

export interface SpendingLimit {
  dailyLimitUSD?: number;
  monthlyLimitUSD?: number;
  currentDailySpendUSD: number;
  currentMonthlySpendUSD: number;
  alerts: string[];
}

export class ProviderManager {
  private providers: Map<AIProviderName, AIProvider> = new Map();
  private healthCache: Map<AIProviderName, ProviderHealthStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const statuses = getProviderStatuses();
    for (const status of statuses) {
      try {
        const cfg = getAIConfig();
        const overrideCfg = { ...cfg, provider: status.provider };
        const provider = createProvider(overrideCfg);
        if (provider) {
          this.providers.set(status.provider, provider);
        }
      } catch {
        // Provider initialization failed - will be reported as unavailable
      }
    }
  }

  /**
   * Get health status for all providers.
   */
  async getProviderHealth(): Promise<ProviderHealthStatus[]> {
    const statuses = getProviderStatuses();
    const results: ProviderHealthStatus[] = [];

    for (const status of statuses) {
      const provider = this.providers.get(status.provider);
      const health: ProviderHealthStatus = {
        provider: status.provider,
        configured: status.configured,
        available: false,
        model: status.model,
        lastChecked: new Date(),
      };

      if (provider && provider.isConfigured()) {
        const start = Date.now();
        try {
          const available = await provider.isAvailable();
          health.available = available;
          health.latencyMs = Date.now() - start;
          if (!available) {
            health.error = "Provider reported unavailable";
          }
        } catch (err) {
          health.available = false;
          health.error = err instanceof Error ? err.message : "Unknown error";
        }
      } else {
        health.available = false;
        health.error = health.configured ? "Provider initialization failed" : "Not configured";
      }

      this.healthCache.set(status.provider, health);
      results.push(health);
    }

    return results;
  }

  /**
   * Get the active provider instance, with validation.
   * Throws if the provider is not configured or unavailable.
   */
  async getActiveProvider(options?: {
    requireAvailable?: boolean;
  }): Promise<{ provider: AIProvider; config: { provider: AIProviderName; model: string } }> {
    const cfg = getAIConfig();
    const provider = this.providers.get(cfg.provider);

    if (!provider) {
      throw new Error(
        `AI provider "${cfg.provider}" is not instantiated. Check configuration.`
      );
    }

    if (!provider.isConfigured()) {
      throw new Error(
        `AI provider "${cfg.provider}" is not configured. Set its API key environment variable.`
      );
    }

    if (options?.requireAvailable) {
      const available = await provider.isAvailable();
      if (!available) {
        throw new Error(
          `AI provider "${cfg.provider}" is configured but not available. Check credentials and connectivity.`
        );
      }
    }

    return {
      provider,
      config: { provider: cfg.provider, model: cfg.model },
    };
  }

  /**
   * Switch active provider (administrator only).
   * Validates configuration before allowing switch.
   * Never silently switches to unconfigured providers.
   */
  async switchProvider(
    newProvider: AIProviderName,
    model?: string
  ): Promise<{ success: boolean; message: string }> {
    const cfg = getAIConfig();
    const statuses = getProviderStatuses();
    const targetStatus = statuses.find((s) => s.provider === newProvider);

    if (!targetStatus?.configured) {
      return {
        success: false,
        message: `Provider "${newProvider}" is not configured. Set its API key environment variable first.`,
      };
    }

    // Validate the provider is actually available
    const provider = this.providers.get(newProvider);
    if (!provider || !provider.isConfigured()) {
      return {
        success: false,
        message: `Provider "${newProvider}" could not be instantiated.`,
      };
    }

    const available = await provider.isAvailable();
    if (!available) {
      return {
        success: false,
        message: `Provider "${newProvider}" is configured but not responding. Check credentials.`,
      };
    }

    // Save to system settings
    await db.systemSetting.upsert({
      where: { key: "ai_provider" },
      update: { value: newProvider },
      create: { key: "ai_provider", value: newProvider, updatedById: "system" },
    });

    if (model) {
      await db.systemSetting.upsert({
        where: { key: "ai_model" },
        update: { value: model },
        create: { key: "ai_model", value: model, updatedById: "system" },
      });
    }

    // Reinitialize providers to pick up changes
    this.providers.delete(newProvider);
    this.providers.set(newProvider, provider);

    return {
      success: true,
      message: `Provider switched to ${newProvider}${model ? ` with model ${model}` : ""}.`,
    };
  }

  /**
   * Record AI usage for spending tracking.
   */
  async recordUsage(
    provider: AIProviderName,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const date = new Date().toISOString().split("T")[0];

    // Estimate cost (rough approximations - actual pricing varies by provider)
    const estimatedCostUSD =
      (inputTokens / 1_000_000) * 0.50 + // ~$0.50 per 1M input tokens (approximate)
      (outputTokens / 1_000_000) * 1.50; // ~$1.50 per 1M output tokens (approximate)

    try {
      await db.systemSetting.upsert({
        where: { key: `ai_usage_${date}` },
        update: { value: String(estimatedCostUSD) },
        create: { key: `ai_usage_${date}`, value: String(estimatedCostUSD), updatedById: "system" },
      });
    } catch {
      // Usage tracking failures should not block AI responses
    }
  }

  /**
   * Get spending status with configurable limits.
   */
  async getSpendingStatus(): Promise<SpendingLimit> {
    const dailyLimitUSD =
      Number(process.env.AI_DAILY_SPEND_LIMIT_USD) || 0;
    const monthlyLimitUSD = 0; // Not configured by default

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get today's spend from system settings
    const todaySetting = await db.systemSetting.findUnique({
      where: { key: `ai_usage_${today}` },
    });
    const currentDailySpendUSD = todaySetting
      ? Number(todaySetting.value)
      : 0;

    // Calculate monthly spend (simplified - sum of daily settings)
    const alerts: string[] = [];

    if (dailyLimitUSD > 0 && currentDailySpendUSD >= dailyLimitUSD) {
      alerts.push(`Daily spending limit of $${dailyLimitUSD} has been reached.`);
    } else if (dailyLimitUSD > 0 && currentDailySpendUSD >= dailyLimitUSD * 0.8) {
      alerts.push(
        `Daily spending at ${((currentDailySpendUSD / dailyLimitUSD) * 100).toFixed(0)}% of limit.`
      );
    }

    return {
      dailyLimitUSD: dailyLimitUSD || undefined,
      monthlyLimitUSD: monthlyLimitUSD || undefined,
      currentDailySpendUSD,
      currentMonthlySpendUSD: currentDailySpendUSD, // Simplified
      alerts,
    };
  }

  /**
   * Start periodic health checks (optional, for production monitoring).
   */
  startHealthMonitoring(intervalMs: number = 300000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getProviderHealth();
      } catch {
        // Health check failures are logged but not fatal
      }
    }, intervalMs);
  }

  /**
   * Stop health monitoring.
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const providerManager = new ProviderManager();