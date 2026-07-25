import { afterEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimitStores } from "./rate-limit";

afterEach(() => {
  resetRateLimitStores();
});

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const first = rateLimit({ key: "t", limit: 2, windowMs: 60_000, now: 1000 });
    const second = rateLimit({
      key: "t",
      limit: 2,
      windowMs: 60_000,
      now: 1001,
    });
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it("blocks when the limit is exceeded", () => {
    rateLimit({ key: "t", limit: 1, windowMs: 60_000, now: 1000 });
    const blocked = rateLimit({
      key: "t",
      limit: 1,
      windowMs: 60_000,
      now: 1001,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window", () => {
    rateLimit({ key: "t", limit: 1, windowMs: 1000, now: 1000 });
    const later = rateLimit({
      key: "t",
      limit: 1,
      windowMs: 1000,
      now: 2001,
    });
    expect(later.allowed).toBe(true);
  });
});
