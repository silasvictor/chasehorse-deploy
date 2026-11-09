import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";

const ShipmentSchema = z.object({
  assignmentId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  quantity: z.number().int().positive().max(100_000),
  destination: z.string().trim().min(3).max(500),
});

export const GET = withAuthz(async (ctx) => {
  try {
    const shipments = await db.shipment.findMany({
      include: {
        assignment: true,
        inventoryItem: {
          include: { warehouse: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const visibleShipments = ctx.role === "FIELD_INSPECTOR"
      ? shipments.filter((shipment) => shipment.assignment?.assigneeId === ctx.userId)
      : shipments;

    return Response.json(visibleShipments);
  } catch (error) {
    console.error("[Shipments] Failed to load shipments", error);
    return Response.json({ error: "Failed to load shipments." }, { status: 500 });
  }
});

export const POST = withAuthz(
  async (ctx, request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = ShipmentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid shipment details.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    try {
      const [assignment, inventoryItem] = await Promise.all([
        db.assignment.findUnique({ where: { id: parsed.data.assignmentId } }),
        db.inventoryItem.findUnique({ where: { id: parsed.data.inventoryItemId } }),
      ]);

      if (!assignment) {
        return Response.json({ error: "The selected assignment was not found." }, { status: 404 });
      }
      if (!inventoryItem) {
        return Response.json({ error: "The selected goods item was not found." }, { status: 404 });
      }
      if (parsed.data.quantity > inventoryItem.quantity) {
        return Response.json(
          { error: "Shipment quantity cannot exceed the recorded inventory quantity." },
          { status: 400 },
        );
      }

      const shipment = await db.shipment.create({
        data: {
          ...parsed.data,
          createdById: ctx.userId,
          status: "PREPARING",
        },
        include: {
          assignment: true,
          inventoryItem: { include: { warehouse: true } },
        },
      });

      await auditLog(ctx, "CREATE_SHIPMENT", "Shipment", shipment.id, {
        assignmentId: shipment.assignmentId,
        inventoryItemId: shipment.inventoryItemId,
        quantity: shipment.quantity,
      });

      return Response.json(shipment, { status: 201 });
    } catch (error) {
      console.error("[Shipments] Failed to create shipment", error);
      return Response.json({ error: "Failed to create shipment." }, { status: 500 });
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER"] },
);
