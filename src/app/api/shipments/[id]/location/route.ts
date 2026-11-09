import { z } from "zod";
import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";

const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().max(100_000).optional(),
});

export const POST = withAuthz(
  async (ctx, request, params) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = LocationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid GPS coordinates.", details: parsed.error.flatten() },
        { status: 400 },
      );
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
        return Response.json({ error: "You can only share GPS for your assigned shipments." }, { status: 403 });
      }
      if (shipment.status === "DELIVERED") {
        return Response.json({ error: "GPS updates are stopped for delivered shipments." }, { status: 409 });
      }

      const recordedAt = new Date();
      await db.shipment.update({
        where: { id: shipment.id },
        data: {
          currentLatitude: parsed.data.latitude,
          currentLongitude: parsed.data.longitude,
          locationAccuracy: parsed.data.accuracy ?? null,
          lastLocationAt: recordedAt,
          status: shipment.status === "PREPARING" ? "IN_TRANSIT" : shipment.status,
        },
      });

      return Response.json({ recordedAt });
    } catch (error) {
      console.error("[Shipments] Failed to save GPS update", error);
      return Response.json({ error: "Failed to save GPS update." }, { status: 500 });
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR"] },
);
