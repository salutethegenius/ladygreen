import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorAlert } from "@/components/ui/alert";
import { getServiceSupabase } from "@/lib/supabase/server";
import { formatBsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  if (status === "successful")
    return "bg-[var(--lganc-light-green)]/40 text-[var(--lganc-dark-green)]";
  if (status === "failed") return "bg-red-100 text-red-800";
  return "bg-[var(--lganc-orange)]/15 text-[var(--lganc-orange)]";
}

export default async function TransactionsPage() {
  let rows: Array<{
    id: string;
    customer_ref: string | null;
    amount_cents: number;
    status: string;
    created_at: string;
  }> = [];
  let loadError: string | null = null;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("id, customer_ref, amount_cents, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    rows = data ?? [];
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Could not load transactions.";
    rows = [];
  }

  return (
    <DashboardShell title="Transactions">
      {loadError && (
        <ErrorAlert
          className="mb-6"
          title="Unable to load transactions"
          message={loadError}
        />
      )}
      {rows.length === 0 && !loadError ? (
        <div className="rounded-lg border border-dashed border-[var(--lganc-light-green)] bg-white p-10 text-center text-sm text-[var(--lganc-dark-green)]/60">
          No transactions yet. Completed Cash N&apos; Go payments will appear
          here.
        </div>
      ) : rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[var(--lganc-light-green)]/50 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--lganc-light-green)]/40 bg-[var(--lganc-beige)] text-[var(--lganc-dark-green)]/70">
              <tr>
                <th className="px-4 py-3 font-medium">Customer reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[var(--lganc-light-green)]/25 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-[var(--lganc-dark-green)]">
                    {tx.customer_ref || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--lganc-dark-green)]">
                    {formatBsd(tx.amount_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(tx.status)}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--lganc-dark-green)]/70">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardShell>
  );
}
