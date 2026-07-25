import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LinksTable, type LinkRow } from "@/components/dashboard/links-table";
import { ErrorAlert } from "@/components/ui/alert";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export default async function LinksPage() {
  let rows: LinkRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("payment_links")
      .select("id, label, amount_cents, status, link_token, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const base = appBaseUrl();
    rows = (data ?? []).map((row) => ({
      ...row,
      url: `${base}/pay/${row.link_token}`,
    }));
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Could not load payment links.";
    rows = [];
  }

  return (
    <DashboardShell title="Payment Links">
      {loadError && (
        <ErrorAlert
          className="mb-6"
          title="Unable to load links"
          message={loadError}
        />
      )}
      <LinksTable initialLinks={rows} />
    </DashboardShell>
  );
}
