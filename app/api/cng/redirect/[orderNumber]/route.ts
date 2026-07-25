import { NextResponse } from "next/server";
import { buildCngPaymentUrl } from "@/lib/cashango/client";
import { getCngCredentials } from "@/lib/settings";
import { getServiceSupabase } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit-response";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const limited = enforceRateLimit(request, "cng-redirect", 30);
  if (limited) return limited;

  const { orderNumber: raw } = await context.params;
  const orderNumber = decodeURIComponent(raw);

  const supabase = getServiceSupabase();
  const { data: session, error } = await supabase
    .from("checkout_sessions")
    .select("*, payment_links:link_id ( id, status, amount_cents )")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !session) {
    return NextResponse.json({ message: "Unknown order" }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.redirect(
      new URL(
        `/cng/return/success?ORDER_NUMBER=${encodeURIComponent(orderNumber)}&STATUS=PAID`,
        appBaseUrl()
      )
    );
  }

  const link = session.payment_links as {
    id: string;
    status: string;
    amount_cents: number;
  } | null;

  if (!link) {
    return NextResponse.json(
      { message: "Payment link not found" },
      { status: 404 }
    );
  }

  if (link.status === "paid") {
    return NextResponse.redirect(
      new URL(
        `/cng/return/success?ORDER_NUMBER=${encodeURIComponent(orderNumber)}&STATUS=PAID`,
        appBaseUrl()
      )
    );
  }

  if (link.amount_cents !== session.expected_amount_cents) {
    return NextResponse.json(
      { message: "Checkout amount mismatch" },
      { status: 400 }
    );
  }

  let credentials;
  try {
    credentials = await getCngCredentials();
  } catch (err) {
    return NextResponse.json(
      {
        message:
          err instanceof Error
            ? err.message
            : "Cash N' Go credentials not configured",
      },
      { status: 500 }
    );
  }

  if (!credentials.merchantId || !credentials.apiKey) {
    return NextResponse.json(
      { message: "Cash N' Go merchant credentials are not configured" },
      { status: 500 }
    );
  }

  const paymentUrl = buildCngPaymentUrl({
    endpoint: credentials.endpoint,
    authId: credentials.merchantId,
    apiKey: credentials.apiKey,
    amountCents: session.expected_amount_cents,
    orderNumber,
    callbackBaseUrl: appBaseUrl(),
  });

  const response = NextResponse.redirect(paymentUrl, 302);
  // Reduce risk of API_KEY leaking via Referer on subsequent navigations.
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
