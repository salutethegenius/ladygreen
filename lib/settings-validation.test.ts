import { describe, expect, it } from "vitest";
import {
  validateContactEmail,
  validateEndpointOverride,
  validateLogoFile,
  validateMerchantId,
} from "./settings-validation";

describe("validateContactEmail", () => {
  it("allows empty (optional)", () => {
    expect(validateContactEmail("")).toBeNull();
  });

  it("accepts a valid email", () => {
    expect(validateContactEmail("admin@lganc.com")).toBeNull();
  });

  it("rejects invalid email", () => {
    expect(validateContactEmail("not-an-email")?.message).toMatch(/invalid/i);
  });
});

describe("validateMerchantId", () => {
  it("allows empty during setup", () => {
    expect(validateMerchantId("")).toBeNull();
  });

  it("accepts alphanumeric merchant ids", () => {
    expect(validateMerchantId("3835")).toBeNull();
  });

  it("rejects spaces / symbols", () => {
    expect(validateMerchantId("bad id!")?.message).toMatch(/Merchant ID/);
  });
});

describe("validateEndpointOverride", () => {
  it("allows empty", () => {
    expect(validateEndpointOverride("")).toBeNull();
  });

  it("requires https", () => {
    expect(validateEndpointOverride("http://example.com")?.message).toMatch(
      /HTTPS/
    );
  });

  it("accepts https urls", () => {
    expect(
      validateEndpointOverride("https://paylanes.example.com/auth")
    ).toBeNull();
  });
});

describe("validateLogoFile", () => {
  it("accepts a small png", () => {
    const file = new File([new Uint8Array(16)], "logo.png", {
      type: "image/png",
    });
    expect(validateLogoFile(file)).toBeNull();
  });

  it("rejects oversized files", () => {
    const file = new File([new Uint8Array(3 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    expect(validateLogoFile(file)?.message).toMatch(/2MB/);
  });

  it("rejects non-image types", () => {
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    expect(validateLogoFile(file)?.message).toMatch(/PNG, JPEG, or WebP/);
  });
});
