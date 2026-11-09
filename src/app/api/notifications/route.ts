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
    const notifications = await db.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(notifications);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const PATCH = withAuthz(async (ctx, req) => {
  try {
    const body = await req.json();
    const { notificationId } = body;
    if (!notificationId) {
      return new Response(JSON.stringify({ error: "notificationId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const notification = await db.notification.updateMany({
      where: { id: notificationId, userId: ctx.userId },
      data: { read: true, readAt: new Date() },
    });
    return Response.json(notification);
  } catch (err) {
    return handleError(err, "Failed to update notification");
  }
});
