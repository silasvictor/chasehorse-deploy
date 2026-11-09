import { db } from "@/lib/db";

export async function GET() {
  try {
    await (db as any).user.count();
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "reachable",
    });
  } catch (err) {
    return Response.json(
      { status: "error", timestamp: new Date().toISOString(), error: err instanceof Error ? err.message : "unknown" },
      { status: 503 },
    );
  }
}