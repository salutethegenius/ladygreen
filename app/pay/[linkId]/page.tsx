import { notFound } from "next/navigation";
import { PayButton } from "@/components/pay/pay-button";
import { BrandMark } from "@/components/layout/brand-mark";
import { getAppSettings } from "@/lib/settings";
import { getServiceSupabase } from "@/lib/supabase/server";
import { formatBsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  const supabase = getServiceSupabase();

  const { data: link, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("link_token", linkId)
    .maybeSingle();

  if (error || !link) notFound();

  let settings = {
    businessName: "Lady Greens Ashes Nursing Concierge",
    logoPath: null as string | null,
  };

  try {
    const app = await getAppSettings();
    settings = { businessName: app.businessName, logoPath: app.logoPath };
  } catch {
    // fall back to defaults
  }

  const isPaid = link.status === "paid";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--lganc-beige)]">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[var(--lganc-light-green)]/30">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4">
              <BrandMark logoPath={settings.logoPath} size={80} />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-[var(--lganc-dark-green)]">
              {settings.businessName}
            </h1>
          </div>

          <div className="mb-8 space-y-2 text-center">
            <p className="font-body text-sm uppercase tracking-wide text-[var(--lganc-muted)]">
              Payment for
            </p>
            <p className="font-heading text-xl text-[var(--lganc-dark-green)]">
              {link.label}
            </p>
            <p className="font-heading text-4xl font-semibold text-[var(--lganc-orange)]">
              {formatBsd(link.amount_cents)}
            </p>
          </div>

          {isPaid ? (
            <div className="rounded-lg bg-green-50 px-4 py-6 text-center">
              <p className="font-heading text-xl text-green-800">Paid</p>
              <p className="mt-1 text-sm text-green-700">
                This payment has already been completed. Thank you!
              </p>
            </div>
          ) : (
            <PayButton linkId={link.link_token} />
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[var(--lganc-dark-green)]/60">
        Powered by KemisPay · Payments processed by Cash N&apos; Go
      </footer>
    </div>
  );
}
