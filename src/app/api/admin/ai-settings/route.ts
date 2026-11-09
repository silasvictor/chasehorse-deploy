import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { getProviderStatuses } from "@/lib/ai/config";
import { z } from "zod";

const SettingsSchema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic"]),
  model: z.string().min(1),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const statuses = getProviderStatuses();
    const currentSetting = await db.systemSetting.findUnique({
      where: { key: "ai_provider" },
    });
    const currentModel = await db.systemSetting.findUnique({
      where: { key: "ai_model" },
    });

    return Response.json({
      providers: statuses,
      activeProvider: currentSetting?.value || "gemini",
      activeModel: currentModel?.value || null,
    });
  } catch (err) {
    return handleError(err, "Failed to load AI settings");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = SettingsSchema.parse(body);

      const statuses = getProviderStatuses();
      const providerStatus = statuses.find((p) => p.provider === data.provider);
      if (!providerStatus?.configured) {
        return new Response(
          JSON.stringify({
            error: `Provider "${data.provider}" is not configured. Set its API key environment variable.`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      await db.systemSetting.upsert({
        where: { key: "ai_provider" },
        update: { value: data.provider },
        create: { key: "ai_provider", value: data.provider, updatedById: ctx.userId },
      });
      await db.systemSetting.upsert({
        where: { key: "ai_model" },
        update: { value: data.model },
        create: { key: "ai_model", value: data.model, updatedById: ctx.userId },
      });

      return Response.json({
        activeProvider: data.provider,
        activeModel: data.model,
      });
    } catch (err) {
      return handleError(err, "Failed to save AI settings");
    }
  },
  { admin: true },
);
