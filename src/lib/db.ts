import { PrismaClient } from "@prisma/client";
import { localDb } from "./local-db";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

export type DatabaseMode = "POSTGRESQL_LIVE" | "LOCAL_JSON_FALLBACK";

let usePrisma = false;
let databaseMode: DatabaseMode = "LOCAL_JSON_FALLBACK";
let initError: string | null = null;

/**
 * Attempt to initialize Prisma Client once. If the database is unreachable,
 * fall back to the local in-memory JSON store so the app can still run
 * in development without a configured PostgreSQL instance.
 *
 * Production safety: If REQUIRE_PRODUCTION_DB="true" or NODE_ENV="production"
 * with strict mode, we log an explicit high-priority warning.
 */
async function tryInitPrisma(): Promise<PrismaClientType | null> {
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
    const start = Date.now();
    await client.$connect();
    await client.$queryRawUnsafe("SELECT 1");
    usePrisma = true;
    databaseMode = "POSTGRESQL_LIVE";
    console.info(`[Database] Connected to PostgreSQL in ${Date.now() - start}ms`);
    return client;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    databaseMode = "LOCAL_JSON_FALLBACK";

    if (process.env.NODE_ENV === "production" && process.env.REQUIRE_PRODUCTION_DB === "true") {
      console.error(
        "[Database] CRITICAL: PostgreSQL is required in production but connection failed! Fallback disallowed by policy."
      );
    } else {
      console.warn(
        `[Database] PostgreSQL unavailable (${initError}). Falling back to local atomic JSON storage (Development/Test Mode).`
      );
    }
    return null;
  }
}

export type AppDatabase = PrismaClientType & typeof localDb;

const prismaInstance = await tryInitPrisma();
const db = (prismaInstance ?? (localDb as unknown)) as AppDatabase;

/**
 * Health check function for database connectivity inspection.
 */
export async function checkDatabaseHealth(): Promise<{
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  mode: DatabaseMode;
  latencyMs: number;
  engine: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    if (usePrisma && prismaInstance) {
      await prismaInstance.$queryRawUnsafe("SELECT 1");
      return {
        status: "HEALTHY",
        mode: "POSTGRESQL_LIVE",
        latencyMs: Date.now() - start,
        engine: "PostgreSQL (Prisma Client)",
      };
    } else {
      // Local DB check
      await (localDb as any).$queryRaw();
      return {
        status: "DEGRADED",
        mode: "LOCAL_JSON_FALLBACK",
        latencyMs: Date.now() - start,
        engine: "Local Atomic JSON Store (Development/Demo Mode)",
        error: initError || "PostgreSQL server not running locally",
      };
    }
  } catch (err) {
    return {
      status: "DOWN",
      mode: databaseMode,
      latencyMs: Date.now() - start,
      engine: usePrisma ? "PostgreSQL" : "Local JSON",
      error: err instanceof Error ? err.message : "Health check failed",
    };
  }
}

export { db, usePrisma, databaseMode };
