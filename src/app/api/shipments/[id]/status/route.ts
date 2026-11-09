import { z } from "zod";
import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";

const StatusSchema = z.object({
  status: z.enum(["DELIVERED", "DELAYED"]),
});

export const PATCH = withAuthz(
  async (ctx, request, params) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Unsupported shipment status." }, { status: 400 });
    }

    try {
      const shipment = await db.shipment.findUnique({
        where: { id: params.id },
        include: { assignment: true },
      });
      if (!shipment) {
        return Response.json({ error: "Shipment not found." }, { status: 404 });
      }
      if (ctx.role === "FIELD_INSPECTOR" && shipment.assignment?.assigneeId !== ctx.userId) {
        return Response.json({ error: "You can only update shipments assigned to you." }, { status: 403 });
      }

      const updated = await db.shipment.update({
        where: { id: shipment.id },
        data: {
          status: parsed.data.status,
          deliveredAt: parsed.data.status === "DELIVERED" ? new Date() : null,
        },
      });
      return Response.json(updated);
    } catch (error) {
      console.error("[Shipments] Failed to update shipment status", error);
      return Response.json({ error: "Failed to update shipment status." }, { status: 500 });
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
