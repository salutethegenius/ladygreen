import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  checkoutSessions,
  paymentLinks,
  transactions,
} from "@/lib/db/schema";

export type SettleResult =
  | { ok: true; alreadySettled?: boolean }
  | { ok: false; error: string; status: number };

/**
 * Parse a Cash N' Go AMOUNT string (dollars) into integer cents.
 * Rejects NaN, negatives, and non-numeric formats.
 */
export function parseWebhookAmountCents(amount: string): number | null {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

/**
 * Atomically settle a Cash N' Go payment:
 * - locks the checkout session + payment link
 * - verifies expected amount
 * - marks session completed + link paid
 * - inserts one transaction row
 * Idempotent: concurrent/duplicate webhooks return alreadySettled.
 */
export async function settleCngPayment(params: {
  orderNumber: string;
  amountCents: number;
  customerRef: string;
  rawPayload: Record<string, unknown>;
}): Promise<SettleResult> {
  try {
    return await db.transaction(async (tx) => {
      const sessions = await tx
        .select()
        .from(checkoutSessions)
        .where(eq(checkoutSessions.orderNumber, params.orderNumber))
        .for("update")
        .limit(1);

      const session = sessions[0];
      if (!session) {
        return { ok: false as const, error: "Unknown order", status: 404 };
      }

      if (session.status === "completed") {
        return { ok: true as const, alreadySettled: true };
      }

      if (session.expectedAmountCents !== params.amountCents) {
        return { ok: false as const, error: "Amount mismatch", status: 400 };
      }

      const links = await tx
        .select()
        .from(paymentLinks)
        .where(eq(paymentLinks.id, session.linkId))
        .for("update")
        .limit(1);

      const link = links[0];
      if (!link) {
        return {
          ok: false as const,
          error: "Payment link not found",
          status: 404,
        };
      }

      if (link.status === "paid") {
        await tx
          .update(checkoutSessions)
          .set({ status: "completed", completedAt: new Date() })
          .where(
            and(
              eq(checkoutSessions.id, session.id),
              eq(checkoutSessions.status, "pending")
            )
          );
        return { ok: true as const, alreadySettled: true };
      }

      const updated = await tx
        .update(checkoutSessions)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(checkoutSessions.id, session.id),
            eq(checkoutSessions.status, "pending")
          )
        )
        .returning({ id: checkoutSessions.id });

      if (updated.length === 0) {
        return { ok: true as const, alreadySettled: true };
      }

      await tx
        .update(paymentLinks)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(paymentLinks.id, session.linkId));

      await tx.insert(transactions).values({
        linkId: session.linkId,
        customerRef: params.customerRef,
        amountCents: params.amountCents,
        status: "successful",
        rawPayload: params.rawPayload,
      });

      return { ok: true as const };
    });
  } catch (err) {
    console.error("[settle] failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Settlement failed",
      status: 500,
    };
  }
}
