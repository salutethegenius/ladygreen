import { describe, expect, it } from "vitest";
import { parseWebhookAmountCents } from "./settle";

describe("parseWebhookAmountCents", () => {
  it("parses whole dollars", () => {
    expect(parseWebhookAmountCents("10")).toBe(1000);
  });

  it("parses cents with two decimals", () => {
    expect(parseWebhookAmountCents("10.50")).toBe(1050);
  });

  it("parses one decimal place", () => {
    expect(parseWebhookAmountCents("10.5")).toBe(1050);
  });

  it("rejects empty / non-numeric", () => {
    expect(parseWebhookAmountCents("")).toBeNull();
    expect(parseWebhookAmountCents("abc")).toBeNull();
    expect(parseWebhookAmountCents("NaN")).toBeNull();
  });

  it("rejects negatives and too many decimals", () => {
    expect(parseWebhookAmountCents("-1.00")).toBeNull();
    expect(parseWebhookAmountCents("1.234")).toBeNull();
  });
});
