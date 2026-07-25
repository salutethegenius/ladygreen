import { describe, expect, it } from "vitest";
import { signWebhookPayload, verifyWebhookSignature } from "./webhook";

describe("verifyWebhookSignature", () => {
  const secret = "test-webhook-secret";
  const body = JSON.stringify({
    ORDER_NUMBER: "lganc_abc",
    AMOUNT: "10.00",
    STATUS: "PAID",
  });

  it("accepts a valid hex HMAC signature", () => {
    const sig = signWebhookPayload(body, secret);
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it("rejects a missing signature", () => {
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
  });

  it("rejects a missing secret", () => {
    const sig = signWebhookPayload(body, secret);
    expect(verifyWebhookSignature(body, sig, undefined)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const sig = signWebhookPayload(body, secret);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
  });

  it("rejects a wrong signature", () => {
    expect(verifyWebhookSignature(body, "00".repeat(32), secret)).toBe(false);
  });
});
