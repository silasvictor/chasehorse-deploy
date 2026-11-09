import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const conversations = await db.aiConversation.findMany({
      where: { userId: ctx.userId },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return Response.json(conversations);
  } catch (err) {
    return handleError(err, "Failed to load conversations");
  }
});

export const POST = withAuthz(async (ctx, req) => {
  try {
    const body = await req.json();
    const { title } = body;
    const conversation = await db.aiConversation.create({
      data: { userId: ctx.userId, title: title || "New conversation" },
    });
    return Response.json(conversation, { status: 201 });
  } catch (err) {
    return handleError(err, "Failed to create conversation");
  }
});
