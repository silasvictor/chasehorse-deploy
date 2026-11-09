import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const documents = await db.document.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      take: 50,
    });
    return Response.json(documents);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      let result;
      try {
        result = await storage.storeFile(buffer, {
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err instanceof Error ? err.message : "Upload failed" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const document = await db.document.create({
        data: {
          originalName: result.originalName,
          storedName: result.storedName,
          fileUrl: result.fileUrl,
          mimeType: result.mimeType,
          size: result.size,
          uploadedById: ctx.userId,
        },
        include: { uploadedBy: { select: { id: true, name: true } } },
      });

      await auditLog(ctx, "UPLOAD_DOCUMENT", "Document", document.id, {
        originalName: result.originalName,
        size: result.size,
      });

      return Response.json(document, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to upload document");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);
