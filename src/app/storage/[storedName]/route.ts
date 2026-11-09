import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ storedName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { storedName } = await context.params;
    const localPath = process.env.LOCAL_STORAGE_PATH ?? "./storage/uploads";
    const filePath = path.join(/*turbopackIgnore: true*/ localPath, storedName);

    // Security: prevent path traversal
    const resolvedPath = path.resolve(/*turbopackIgnore: true*/ filePath);
    const resolvedLocal = path.resolve(/*turbopackIgnore: true*/ localPath);
    if (!resolvedPath.startsWith(resolvedLocal)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!fs.existsSync(/*turbopackIgnore: true*/ resolvedPath)) {
      return new NextResponse(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileBuffer = await fs.promises.readFile(/*turbopackIgnore: true*/ resolvedPath);
    const ext = path.extname(storedName).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".tif": "image/tiff",
      ".tiff": "image/tiff",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".csv": "text/csv",
    };

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${storedName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
