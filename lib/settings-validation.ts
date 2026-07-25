const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SettingsValidationError = { message: string };

export function validateContactEmail(
  email: string
): SettingsValidationError | null {
  if (!email) return null; // optional
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { message: "Contact email is invalid" };
  }
  return null;
}

export function validateMerchantId(
  merchantId: string
): SettingsValidationError | null {
  if (!merchantId) return null; // allow clearing during setup
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(merchantId)) {
    return {
      message:
        "Merchant ID must be 1–64 characters (letters, numbers, _ or -)",
    };
  }
  return null;
}

export function validateEndpointOverride(
  url: string
): SettingsValidationError | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { message: "Endpoint override must be an HTTPS URL" };
    }
    return null;
  } catch {
    return { message: "Endpoint override is not a valid URL" };
  }
}

export function validateLogoFile(
  file: File
): SettingsValidationError | null {
  if (file.size <= 0) {
    return { message: "Logo file is empty" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { message: "Logo must be 2MB or smaller" };
  }
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return {
      message: "Logo must be a PNG, JPEG, or WebP image",
    };
  }
  return null;
}

export function logoExtensionForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

export { ALLOWED_LOGO_TYPES, MAX_LOGO_BYTES };
