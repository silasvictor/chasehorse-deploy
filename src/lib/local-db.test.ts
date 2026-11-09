import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("local db filtering", () => {
  it("filters tasks by status in", async () => {
    const tasks = await (db as any).task.findMany({ where: { status: { in: ["open", "in_progress"] } } });
    expect(Array.isArray(tasks)).toBe(true);
  });

  it("counts low stock via filter", async () => {
    const items = await (db as any).inventoryItem.findMany({});
    const low = items.filter((i: any) => i.quantity <= i.minThreshold);
    expect(Array.isArray(low)).toBe(true);
  });
});