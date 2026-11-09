import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const DiscrepancySchema = z.object({
  inventoryItemId: z.string(),
  recordedQty: z.number().int(),
  countedQty: z.number().int(),
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]).default("OPEN"),
  notes: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const discrepancies = await db.stockDiscrepancy.findMany({
      include: {
        inventoryItem: { include: { warehouse: { select: { id: true, name: true } } } },
        reporter: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(discrepancies);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = DiscrepancySchema.parse(body);
      const difference = data.countedQty - data.recordedQty;
      const discrepancy = await db.stockDiscrepancy.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          recordedQty: data.recordedQty,
          countedQty: data.countedQty,
          difference,
          status: data.status,
          notes: data.notes,
          reportedById: ctx.userId,
        },
        include: { inventoryItem: { include: { warehouse: { select: { id: true, name: true } } } } },
      });
      await auditLog(ctx, "CREATE_DISCREPANCY", "StockDiscrepancy", discrepancy.id, {
        difference,
      });
      return Response.json(discrepancy, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create discrepancy");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
