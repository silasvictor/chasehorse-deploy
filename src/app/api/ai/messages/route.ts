import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ conversationId: z.string() });

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conv = await db.aiConversation.findFirst({
      where: { id: conversationId, userId: ctx.userId },
    });
    if (!conv) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = await db.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(messages);
  } catch (err) {
    return handleError(err, "Failed to load messages");
  }
});
