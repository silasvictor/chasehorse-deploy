import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";

const InventorySchema = z.object({
  warehouseId: z.string(),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().default("pcs"),
  minThreshold: z.number().int().min(0).default(0),
  location: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = withAuthz(async (ctx) => {
  try {
    const inventory = await db.inventoryItem.findMany({
      include: { warehouse: { select: { id: true, name: true, code: true } } },
      orderBy: { name: "asc" },
    });
    return Response.json(inventory);
  } catch (err) {
    return handleError(err, "Database unavailable. Please configure DATABASE_URL and run migrations.");
  }
});

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = InventorySchema.parse(body);
      const item = await db.inventoryItem.create({
        data: {
          warehouseId: data.warehouseId,
          sku: data.sku,
          name: data.name,
          quantity: data.quantity,
          unit: data.unit,
          minThreshold: data.minThreshold,
          location: data.location,
        },
        include: { warehouse: { select: { id: true, name: true } } },
      });
      return Response.json(item, { status: 201 });
    } catch (err) {
      return handleError(err, "Failed to create inventory item");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
