/**
 * Helper for API routes: retrieves the NextAuth session and builds a
 * PermissionContext. Enforces server-side authorization.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  sessionToContext,
  requireRole,
  requireAdmin,
  type PermissionContext,
  type UserRole,
} from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export interface RouteParams {
  params: Promise<{ [key: string]: string }> | { [key: string]: string };
}

export async function getAuthContext(
  request: NextRequest,
): Promise<{
  context: PermissionContext | null;
  error?: Response;
}> {
  const session = await getServerSession(authOptions);
  const context = sessionToContext(session);

  if (!context) {
    return {
      context: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!context.isActive) {
    return {
      context,
      error: NextResponse.json({ error: "Account deactivated" }, { status: 403 }),
    };
  }

  return { context, error: undefined };
}

export { requireRole, requireAdmin };

/**
 * Wraps a route handler with auth + optional role enforcement.
 * The inner handler receives (context, request, params).
 */
export function withAuthz(
  handler: (ctx: PermissionContext, request: NextRequest, params: { [key: string]: string }) => Promise<Response>,
  options?: { roles?: UserRole[]; admin?: boolean },
): (request: NextRequest, routeParams?: RouteParams) => Promise<Response>;
export function withAuthz(
  handler: (ctx: PermissionContext, request: NextRequest) => Promise<Response>,
  options?: { roles?: UserRole[]; admin?: boolean },
): (request: NextRequest, routeParams?: RouteParams) => Promise<Response>;
export function withAuthz(
  handler: (ctx: PermissionContext) => Promise<Response>,
  options?: { roles?: UserRole[]; admin?: boolean },
): (request: NextRequest, routeParams?: RouteParams) => Promise<Response>;
export function withAuthz(
  handler: any,
  options: { roles?: UserRole[]; admin?: boolean } = {},
) {
  return async (request: NextRequest, routeParams?: RouteParams): Promise<Response> => {
    const { context, error } = await getAuthContext(request);
    if (error) return error;
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsRaw = routeParams?.params;
    const params = paramsRaw
      ? (await Promise.resolve(paramsRaw))
      : ({} as { [key: string]: string });

    if (options.admin) {
      requireAdmin(context);
    } else if (options.roles) {
      requireRole(context, ...options.roles);
    }

    if (handler.length >= 3) {
      return (handler as any)(context, request, params);
    }
    if (handler.length >= 2) {
      return (handler as any)(context, request);
    }
    return (handler as any)(context);
  };
}
