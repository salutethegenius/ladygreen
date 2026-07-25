import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/cashango/webhook";
import { parsePaidWebhookBody } from "@/lib/cashango/webhook-payload";
import { settleCngPayment } from "@/lib/cashango/settle";
import { getCngCredentials } from "@/lib/settings";
import { enforceRateLimit } from "@/lib/rate-limit-response";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "webhook-cng", 120);
  if (limited) return limited;

  const rawBody = await request.text();

  let credentials;
  try {
    credentials = await getCngCredentials();
  } catch {
    return NextResponse.json(
      { message: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const secret =
    credentials.webhookSecret || process.env.CASHANGO_WEBHOOK_SECRET;
  const signature =
    request.headers.get("x-lganc-signature") ??
    request.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, string | undefined>;
  try {
    body = JSON.parse(rawBody) as Record<string, string | undefined>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePaidWebhookBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  const result = await settleCngPayment({
    orderNumber: parsed.orderNumber,
    amountCents: parsed.amountCents,
    customerRef: parsed.customerRef,
    rawPayload: body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    ...(result.alreadySettled ? { alreadySettled: true } : {}),
  });
}
