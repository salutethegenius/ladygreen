import { parseWebhookAmountCents } from "./settle";

export type PaidWebhookParseResult =
  | {
      ok: true;
      orderNumber: string;
      amountCents: number;
      customerRef: string;
    }
  | { ok: false; message: string };

/**
 * Validate a Cash N' Go PAID webhook JSON body (after signature verification).
 */
export function parsePaidWebhookBody(
  body: Record<string, string | undefined>
): PaidWebhookParseResult {
  const { ORDER_NUMBER, AMOUNT, STATUS, EMAIL, PHONE } = body;

  if (STATUS !== "PAID") {
    return { ok: false, message: "Invalid payload" };
  }
  if (!ORDER_NUMBER) {
    return { ok: false, message: "Invalid payload" };
  }
  if (AMOUNT == null || AMOUNT === "") {
    return { ok: false, message: "AMOUNT is required" };
  }

  const amountCents = parseWebhookAmountCents(AMOUNT);
  if (amountCents === null) {
    return { ok: false, message: "Invalid AMOUNT" };
  }

  return {
    ok: true,
    orderNumber: ORDER_NUMBER,
    amountCents,
    customerRef: EMAIL || PHONE || ORDER_NUMBER,
  };
}
