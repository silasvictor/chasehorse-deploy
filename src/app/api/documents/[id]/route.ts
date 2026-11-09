import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import type { RouteParams } from "@/lib/api";

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const DELETE = withAuthz(
  async (ctx, _req, params) => {
    try {
      const { id } = params as { id: string };

      const document = await db.document.findUnique({
        where: { id },
      });

      if (!document) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Only allow deletion by the uploader or an administrator
      if (
        ctx.role !== "ADMINISTRATOR" &&
        document.uploadedById !== ctx.userId
      ) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete the file from storage
      const storedName = document.storedName;
      try {
        await storage.deleteFile(storedName);
      } catch {
        // File deletion failure should not block document record deletion
      }

      await db.document.delete({
        where: { id },
      });

      await auditLog(ctx, "DELETE_DOCUMENT", "Document", id, {
        originalName: document.originalName,
      });

      return new Response(null, { status: 204 });
    } catch (err) {
      return handleError(err, "Failed to delete document");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);
