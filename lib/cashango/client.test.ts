import { describe, expect, it } from "vitest";
import {
  buildCngPaymentUrl,
  makeOrderNumber,
  resolveCngPaymentOptions,
} from "./client";

describe("makeOrderNumber", () => {
  it("returns an unpredictable lganc_ prefixed id", () => {
    const a = makeOrderNumber();
    const b = makeOrderNumber();
    expect(a).toMatch(/^lganc_/);
    expect(b).toMatch(/^lganc_/);
    expect(a).not.toBe(b);
  });
});

describe("resolveCngPaymentOptions", () => {
  it("maps aliases", () => {
    expect(resolveCngPaymentOptions("card,moneymaxx,cashngo")).toBe(
      "card,mmx,cng"
    );
  });
});

describe("buildCngPaymentUrl", () => {
  it("includes order amount and never returns a bare key-only string", () => {
    const url = buildCngPaymentUrl({
      endpoint: "https://paylanes-qa.example/auth",
      authId: "3835",
      apiKey: "secret-key",
      amountCents: 2500,
      orderNumber: "lganc_test",
      callbackBaseUrl: "https://app.example",
    });
    expect(url).toContain("AMOUNT=25.00");
    expect(url).toContain("ORDER_NUMBER=lganc_test");
    expect(url).toContain("API_KEY=secret-key");
    expect(url.startsWith("https://paylanes-qa.example/auth?")).toBe(true);
  });
});
