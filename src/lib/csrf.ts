import crypto from "crypto";
import { NextRequest } from "next/server";

const CSRF_SECRET = process.env.NEXTAUTH_SECRET || "chasehorse-csrf-security-salt-2026";
const CSRF_COOKIE_NAME = "chasehorse_csrf_token";
const TOKEN_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Creates a signed CSRF token with a timestamp and HMAC signature.
 */
export function generateCsrfToken(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${nonce}.${timestamp}`;
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

/**
 * Validates a CSRF token string.
 */
export function validateCsrfToken(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [nonce, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) return false;

  // Check token age
  if (Date.now() - timestamp > TOKEN_MAX_AGE_MS) {
    return false; // Token expired
  }

  // Verify HMAC signature
  const expectedPayload = `${nonce}.${timestampStr}`;
  const expectedSignature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(expectedPayload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verifies CSRF protection for an incoming HTTP request.
 * Safe methods (GET, HEAD, OPTIONS) pass automatically.
 * State-modifying methods (POST, PUT, PATCH, DELETE) require a valid token in
 * the 'x-csrf-token' header or matching the CSRF cookie.
 */
export function verifyCsrfProtection(req: NextRequest | Request): {
  valid: boolean;
  error?: string;
} {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Read CSRF token from request header
  const headerToken =
    req.headers.get("x-csrf-token") ||
    req.headers.get("X-CSRF-Token") ||
    req.headers.get("x-xsrf-token");

  if (!headerToken) {
    return {
      valid: false,
      error: "Missing CSRF token in request headers (x-csrf-token).",
    };
  }

  if (!validateCsrfToken(headerToken)) {
    return {
      valid: false,
      error: "Invalid or expired CSRF token. Please refresh the page.",
    };
  }

  return { valid: true };
}

export { CSRF_COOKIE_NAME };

