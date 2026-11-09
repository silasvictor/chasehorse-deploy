import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { ragService } from "@/lib/ai/rag-service";
import type { AIMessage } from "@/lib/ai/provider-interface";
import { z } from "zod";

const ChatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const POST = withAuthz(async (ctx, req) => {
  try {
    const { rateLimit, clientKey } = await import("@/lib/rate-limit");
    const rl = rateLimit(clientKey(req, ctx.userId), 30, 60_000);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      });
    }
    const body = await req.json();
    const data = ChatSchema.parse(body);

    // Get or create conversation
    let conversation;
    if (data.conversationId) {
      conversation = await db.aiConversation.findFirst({
        where: { id: data.conversationId, userId: ctx.userId },
      });
    }
    if (!conversation) {
      conversation = await db.aiConversation.create({
        data: { userId: ctx.userId, title: "New conversation" },
      });
    }

    // Save user message
    await db.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: data.message,
      },
    });

    // Use RAG service for context-aware responses
    const ragResult = await ragService.generateWithRAG(
      {
        userId: ctx.userId,
        userRole: ctx.role,
        query: data.message,
        conversationId: conversation.id,
      },
      {}
    );

    // Record usage for spending tracking
    if (ragResult.usage) {
      try {
        const today = new Date().toISOString().split("T")[0];
        const usageKey = `ai_usage_${today}`;
        const existing = await db.systemSetting.findUnique({ where: { key: usageKey } });
        const currentVal = Number(existing?.value || 0);
        const addedVal = (ragResult.usage.totalTokens || 0) / 1_000_000 * 0.5;
        await db.systemSetting.upsert({
          where: { key: usageKey },
          update: { value: String(currentVal + addedVal) },
          create: { key: usageKey, value: String(addedVal), updatedById: ctx.userId },
        });
      } catch {
        // Usage tracking failures should not block AI responses
      }
    }

    return Response.json({
      conversationId: conversation.id,
      messageId: `msg-${Date.now()}`,
      text: ragResult.response,
      provider: ragResult.provider,
      model: ragResult.model,
      usage: ragResult.usage,
      sources: ragResult.sources,
    });
  } catch (err) {
    return handleError(err, "AI chat failed");
  }
});