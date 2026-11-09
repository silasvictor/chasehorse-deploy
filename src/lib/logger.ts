/**
 * Minimal structured logger with secret redaction.
 */
const REDACT_KEYS = ["password", "token", "secret", "apikey", "api_key", "authorization"];

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    for (const key of REDACT_KEYS) {
      if (value.toLowerCase().includes(key)) return "[REDACTED]";
    }
    return value;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.some((r) => k.toLowerCase().includes(r))) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(JSON.stringify({ level: "info", message, meta: redact(meta), ts: new Date().toISOString() }));
  },
  warn(message: string, meta?: unknown) {
    console.warn(JSON.stringify({ level: "warn", message, meta: redact(meta), ts: new Date().toISOString() }));
  },
  error(message: string, meta?: unknown) {
    console.error(JSON.stringify({ level: "error", message, meta: redact(meta), ts: new Date().toISOString() }));
  },
};