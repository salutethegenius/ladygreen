import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LinkGenerator } from "@/components/dashboard/link-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/ui/alert";
import { getDashboardStats } from "@/lib/analytics";
import { formatBsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats = {
    totalInvoicedCents: 0,
    paymentsDueCents: 0,
    todaysRevenueCents: 0,
  };
  let loadError: string | null = null;

  try {
    stats = await getDashboardStats();
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Could not load dashboard statistics.";
  }

  const cards = [
    {
      label: "Total Invoiced",
      value: formatBsd(stats.totalInvoicedCents),
      accent: "text-[var(--lganc-dark-green)]",
    },
    {
      label: "Payments Due",
      value: formatBsd(stats.paymentsDueCents),
      accent: "text-[var(--lganc-orange)]",
    },
    {
      label: "Today's Revenue",
      value: formatBsd(stats.todaysRevenueCents),
      accent: "text-[var(--lganc-dark-green)]",
    },
  ];

  return (
    <DashboardShell title="Dashboard">
      {loadError && (
        <ErrorAlert
          className="mb-6"
          title="Unable to load stats"
          message={loadError}
        />
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="overflow-hidden">
            <div className="h-1 bg-[var(--lganc-orange)]" />
            <CardHeader>
              <CardTitle>{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`font-heading text-3xl font-semibold ${card.accent}`}
              >
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <LinkGenerator />
    </DashboardShell>
  );
}
