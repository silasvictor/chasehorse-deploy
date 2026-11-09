import { describe, it, expect } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rate limit", () => {
  it("blocks after limit", () => {
    const key = "test-" + Math.random();
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60000);
    const res = rateLimit(key, 3, 60000);
    expect(res.allowed).toBe(false);
  });
});