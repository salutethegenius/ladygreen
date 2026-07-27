import { nanoid } from "nanoid";
import { toDollarsString } from "@/lib/utils";
import { resolveCngEndpoint } from "./endpoints";

const CNG_OPTION_MAP: Record<string, string> = {
  card: "card",
  cng: "cng",
  mmx: "mmx",
  sd: "sd",
  moneymaxx: "mmx",
  moneymax: "mmx",
  cashngo: "cng",
};

export function resolveCngPaymentOptions(rawOpts: string): string {
  return rawOpts
    .split(",")
    .map((o) => CNG_OPTION_MAP[o.trim().toLowerCase()] ?? o.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
}

export type CngUrlParams = {
  endpoint: string;
  authId: string;
  apiKey: string;
  amountCents: number;
  orderNumber: string;
  callbackBaseUrl: string;
  paymentOptions?: string;
};

/**
 * Build the Cash N' Go / PayLanes Web Payment Auth redirect URL.
 *
 * Provider constraint: PayLanes expects `API_KEY` as a query param on the auth
 * URL (not an HTTP header). The key therefore appears in the browser Location
 * after our server-side 302. Mitigations:
 * - Never return this URL in JSON API responses (only redirect)
 * - Never log the full payment URL
 * - Set Referrer-Policy: no-referrer on the redirect response
 * - Prefer rotating the URL API_KEY if it may have been exposed
 */
export function buildCngPaymentUrl(params: CngUrlParams): string {
  // Browser return pages (display only — settlement is via signed webhook)
  const successUrl = `${params.callbackBaseUrl}/cng/return/success`;
  const cancelUrl = `${params.callbackBaseUrl}/cng/return/cancel`;
  const resolvedPaymentOpts = resolveCngPaymentOptions(
    params.paymentOptions || "card,mmx,cng"
  );

  const urlParams = new URLSearchParams();
  urlParams.set("AUTH_ID", params.authId);
  urlParams.set("AMOUNT", toDollarsString(params.amountCents));
  urlParams.set("URL_SUCCESS", successUrl);
  urlParams.set("URL_CANCEL", cancelUrl);
  urlParams.set("ORDER_NUMBER", params.orderNumber);
  urlParams.set("PAYMENT_OPTIONS", resolvedPaymentOpts);
  // API_KEY last; callers must not log the resulting string.
  urlParams.set("API_KEY", params.apiKey);

  return `${params.endpoint}?${urlParams.toString()}`;
}

/** Unpredictable order number for Cash N' Go (not derived from link token). */
export function makeOrderNumber(): string {
  return `lganc_${nanoid(24)}`;
}

export { resolveCngEndpoint };
