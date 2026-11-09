import { describe, it, expect } from "vitest";
import {
  hasRole,
  requireRole,
  requireAdmin,
  ROLE_HIERARCHY,
  type PermissionContext,
} from "@/lib/permissions";

function ctx(role: string, isActive = true): PermissionContext {
  return { userId: "u1", role: role as any, isActive };
}

describe("Role-based access control", () => {
  it("hierarchy orders roles correctly", () => {
    expect(ROLE_HIERARCHY.READ_ONLY_VIEWER).toBe(1);
    expect(ROLE_HIERARCHY.ADMINISTRATOR).toBe(5);
    expect(ROLE_HIERARCHY.ADMINISTRATOR).toBeGreaterThan(ROLE_HIERARCHY.READ_ONLY_VIEWER);
  });

  it("hasRole returns true for equal or higher role", () => {
    expect(hasRole(ctx("ADMINISTRATOR"), "ADMINISTRATOR")).toBe(true);
    expect(hasRole(ctx("ADMINISTRATOR"), "OPERATIONS_MANAGER")).toBe(true);
    expect(hasRole(ctx("OPERATIONS_MANAGER"), "FIELD_INSPECTOR")).toBe(true);
    expect(hasRole(ctx("READ_ONLY_VIEWER"), "ADMINISTRATOR")).toBe(false);
    expect(hasRole(ctx("AUDITOR"), "OPERATIONS_MANAGER")).toBe(false);
  });

  it("hasRole returns false for inactive user", () => {
    expect(hasRole(ctx("ADMINISTRATOR", false), "ADMINISTRATOR")).toBe(false);
  });

  it("requireRole throws for insufficient permissions", () => {
    expect(() => requireRole(ctx("READ_ONLY_VIEWER"), "ADMINISTRATOR")).toThrow();
    expect(() => requireRole(ctx("READ_ONLY_VIEWER"), "OPERATIONS_MANAGER")).toThrow();
    expect(() => requireRole(ctx("OPERATIONS_MANAGER"), "OPERATIONS_MANAGER")).not.toThrow();
  });

  it("requireAdmin throws for non-admins", () => {
    expect(() => requireAdmin(ctx("OPERATIONS_MANAGER"))).toThrow();
    expect(() => requireAdmin(ctx("ADMINISTRATOR"))).not.toThrow();
  });

  it("requireRole error has statusCode 403", () => {
    try {
      requireRole(ctx("READ_ONLY_VIEWER"), "ADMINISTRATOR");
    } catch (e) {
      expect((e as Error & { statusCode?: number }).statusCode).toBe(403);
    }
  });
});
