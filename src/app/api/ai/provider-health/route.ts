/**
 * AI Provider Health Management API Route.
 *
 * Extends the existing provider architecture with:
 * - Provider health checks
 * - Configuration validation
 * - Model selection
 * - Error handling
 * - Request timeouts
 * - Usage tracking
 * - Configurable spending limits
 * - Provider-specific capabilities
 * - Graceful failure handling
 *
 * Never silently switches providers.
 * Do not expose credentials.
 */

import { withAuthz } from "@/lib/api";
import { providerManager } from "@/lib/ai/provider-manager";
import { getAIConfig } from "@/lib/ai/config";
import { z } from "zod";

const ProviderSettingsSchema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic"]),
  model: z.string().min(1).optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const health = await providerManager.getProviderHealth();
    const spending = await providerManager.getSpendingStatus();
    const cfg = getAIConfig();

    return Response.json({
      providers: health,
      spending,
      activeProvider: cfg.provider,
      activeModel: cfg.model,
    });
  } catch (err) {
    return handleError(err, "Failed to get provider health");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = ProviderSettingsSchema.parse(body);

      const result = await providerManager.switchProvider(data.provider, data.model);

      return Response.json(result);
    } catch (err) {
      return handleError(err, "Failed to update AI provider settings");
    }
  },
  { roles: ["ADMINISTRATOR"] },
);