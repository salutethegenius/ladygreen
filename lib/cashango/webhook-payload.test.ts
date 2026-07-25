import { describe, expect, it } from "vitest";
import { parsePaidWebhookBody } from "./webhook-payload";

describe("parsePaidWebhookBody", () => {
  it("accepts a valid PAID payload", () => {
    const result = parsePaidWebhookBody({
      ORDER_NUMBER: "lganc_abc",
      AMOUNT: "25.00",
      STATUS: "PAID",
      EMAIL: "customer@example.com",
    });
    expect(result).toEqual({
      ok: true,
      orderNumber: "lganc_abc",
      amountCents: 2500,
      customerRef: "customer@example.com",
    });
  });

  it("rejects non-PAID status", () => {
    const result = parsePaidWebhookBody({
      ORDER_NUMBER: "lganc_abc",
      AMOUNT: "25.00",
      STATUS: "FAILED",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects missing ORDER_NUMBER", () => {
    const result = parsePaidWebhookBody({
      AMOUNT: "25.00",
      STATUS: "PAID",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects missing AMOUNT", () => {
    const result = parsePaidWebhookBody({
      ORDER_NUMBER: "lganc_abc",
      STATUS: "PAID",
    });
    expect(result).toEqual({ ok: false, message: "AMOUNT is required" });
  });

  it("rejects NaN / invalid AMOUNT", () => {
    const result = parsePaidWebhookBody({
      ORDER_NUMBER: "lganc_abc",
      AMOUNT: "not-a-number",
      STATUS: "PAID",
    });
    expect(result).toEqual({ ok: false, message: "Invalid AMOUNT" });
  });

  it("falls back customer ref to ORDER_NUMBER", () => {
    const result = parsePaidWebhookBody({
      ORDER_NUMBER: "lganc_abc",
      AMOUNT: "1.00",
      STATUS: "PAID",
    });
    expect(result.ok && result.customerRef).toBe("lganc_abc");
  });
});
