import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { ErrorAlert } from "@/components/ui/alert";
import { getAppSettings, maskSecret } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings: Awaited<ReturnType<typeof getAppSettings>> = {
    businessName: "Lady Greens Ashes Nursing Concierge",
    contactEmail: "",
    logoPath: null,
    cngMerchantId: "",
    cngApiKey: "",
    cngWebhookSecret: "",
    cngEnvironment: "qa",
    cngEndpointOverride: "",
  };
  let loadError: string | null = null;

  try {
    settings = await getAppSettings();
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Could not load settings.";
  }

  return (
    <DashboardShell title="Settings">
      {loadError && (
        <ErrorAlert
          className="mb-6"
          title="Unable to load settings"
          message={loadError}
        />
      )}
      <SettingsForm
        initial={{
          businessName: settings.businessName,
          contactEmail: settings.contactEmail,
          logoPath: settings.logoPath,
          cngMerchantId: settings.cngMerchantId,
          cngApiKeyMasked: maskSecret(settings.cngApiKey),
          cngWebhookSecretMasked: maskSecret(settings.cngWebhookSecret),
          cngEnvironment: settings.cngEnvironment,
          cngEndpointOverride: settings.cngEndpointOverride,
          hasApiKey: Boolean(settings.cngApiKey),
          hasWebhookSecret: Boolean(settings.cngWebhookSecret),
        }}
      />
    </DashboardShell>
  );
}
