import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import type { RouteParams } from "@/lib/api";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  status: z.enum(["DRAFT", "GENERATED", "PUBLISHED"]).optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx, _req, params) => {
  try {
    const { id } = params as { id: string };

    const report = await db.report.findUnique({
      where: { id },
    });

    if (!report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only the generator or an administrator can view a report
    if (report.generatedById !== ctx.userId && ctx.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(report);
  } catch (err) {
    return handleError(err, "Failed to load report");
  }
});

export const PATCH = withAuthz(
  async (ctx, req, params) => {
    try {
      const { id } = params as { id: string };
      const body = await req.json();
      const data = UpdateSchema.parse(body);

      const report = await db.report.findUnique({
        where: { id },
      });

      if (!report) {
        return new Response(JSON.stringify({ error: "Report not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Only the generator or an administrator can update a report
      if (report.generatedById !== ctx.userId && ctx.role !== "ADMINISTRATOR") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updated = await db.report.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      await auditLog(ctx, "PUBLISH_REPORT", "Report", id, {
        title: updated.title,
        status: updated.status,
      });

      return Response.json(updated);
    } catch (err) {
      return handleError(err, "Failed to update report");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "AUDITOR"] },
);

export const DELETE = withAuthz(
  async (ctx, _req, params) => {
    try {
      const { id } = params as { id: string };

      const report = await db.report.findUnique({
        where: { id },
      });

      if (!report) {
        return new Response(JSON.stringify({ error: "Report not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Only the generator or an administrator can delete a report
      if (report.generatedById !== ctx.userId && ctx.role !== "ADMINISTRATOR") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      await db.report.delete({
        where: { id },
      });

      return new Response(null, { status: 204 });
    } catch (err) {
      return handleError(err, "Failed to delete report");
    }
  },
  { roles: ["ADMINISTRATOR"] },
);
