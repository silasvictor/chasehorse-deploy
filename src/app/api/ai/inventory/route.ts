import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import { AIService } from "@/lib/ai/ai-service";
import { z } from "zod";

const InventorySchema = z.object({
  analysisType: z.enum(["SUMMARIZE", "DISCREPANCIES", "REORDER_ALERTS", "PATTERNS", "MOVEMENT"]).default("SUMMARIZE"),
  warehouseId: z.string().optional(),
  itemSku: z.string().optional(),
});

async function handleError(err: unknown, fallback: string) {
  return new Response(
    JSON.stringify({ error: err instanceof Error ? err.message : fallback }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

export const POST = withAuthz(
  async (ctx, req) => {
    try {
      const body = await req.json();
      const data = InventorySchema.parse(body);

      const [inventoryItems, discrepancies] = await Promise.all([
        db.inventoryItem.findMany({
          where: data.warehouseId ? { warehouseId: data.warehouseId } : {},
          include: { warehouse: { select: { id: true, name: true } } },
          orderBy: { name: "asc" },
        }),
        db.stockDiscrepancy.findMany({
          where: data.warehouseId ? { inventoryItem: { warehouseId: data.warehouseId } } : {},
          include: {
            inventoryItem: { include: { warehouse: { select: { id: true, name: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

      const service = new AIService({ userId: ctx.userId });

      const context = `
Inventory Items (${inventoryItems.length} total):
${inventoryItems.map((i) => `- ${i.name} (${i.sku}): ${i.quantity} ${i.unit}, Warehouse: ${i.warehouse?.name || "Unknown"}`).join("\n")}

Stock Discrepancies (${discrepancies.length} total):
${discrepancies.map((d) => `- ${d.inventoryItem?.name || "Unknown"}: Recorded ${d.recordedQty}, Counted ${d.countedQty}, Difference: ${d.difference > 0 ? "+" : ""}${d.difference}`).join("\n")}
`;

      let analysisResult: string;

      if (data.analysisType === "SUMMARIZE") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are an inventory analysis assistant. Summarize inventory data.` },
            { role: "user", content: `Analyze this inventory:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else if (data.analysisType === "DISCREPANCIES") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are an inventory discrepancy analyst. Analyze stock discrepancies.` },
            { role: "user", content: `Analyze these discrepancies:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else if (data.analysisType === "REORDER_ALERTS") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are an inventory reorder analyst. Identify items that need reordering.` },
            { role: "user", content: `Analyze low stock items:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else if (data.analysisType === "PATTERNS") {
        const result = await service.generate({
          messages: [
            { role: "system", content: `You are an inventory pattern analyst. Identify patterns in inventory data.` },
            { role: "user", content: `Analyze inventory patterns:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        });
        analysisResult = result.text;
      } else {
        analysisResult = (await service.generate({
          messages: [
            { role: "system", content: `You are an inventory analysis assistant.` },
            { role: "user", content: `Analyze this inventory data:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 2000,
        })).text;
      }

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: "AI_INVENTORY_ANALYSIS",
          entityType: "InventoryItem",
          entityId: data.itemSku || "multiple",
          metadata: JSON.stringify({
            analysisType: data.analysisType,
            itemCount: inventoryItems.length,
            discrepancyCount: discrepancies.length,
          }),
        },
      });

      return Response.json({
        analysisType: data.analysisType,
        analysis: analysisResult,
        itemsAnalyzed: inventoryItems.length,
        openDiscrepancies: discrepancies.filter((d) => d.status === "OPEN").length,
        lowStockItems: inventoryItems.filter((i) => i.quantity <= i.minThreshold).length,
        provider: "gemini",
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return handleError(err, "Inventory analysis failed");
    }
  },
  { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"] },
);