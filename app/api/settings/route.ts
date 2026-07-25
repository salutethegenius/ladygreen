import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceSupabase } from "@/lib/supabase/server";
import { upsertSettings } from "@/lib/settings";
import { SETTINGS_KEYS } from "@/lib/db/schema";
import {
  logoExtensionForMime,
  validateContactEmail,
  validateEndpointOverride,
  validateLogoFile,
  validateMerchantId,
} from "@/lib/settings-validation";
import { enforceRateLimit } from "@/lib/rate-limit-response";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "settings", 20);
  if (limited) return limited;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const businessName = String(form.get("businessName") ?? "").trim();
  const contactEmail = String(form.get("contactEmail") ?? "").trim();
  const cngMerchantId = String(form.get("cngMerchantId") ?? "").trim();
  const cngEnvironment = String(form.get("cngEnvironment") ?? "qa").trim();
  const cngEndpointOverride = String(
    form.get("cngEndpointOverride") ?? ""
  ).trim();
  const cngApiKey = String(form.get("cngApiKey") ?? "").trim();
  const cngWebhookSecret = String(form.get("cngWebhookSecret") ?? "").trim();
  const logo = form.get("logo");

  const emailError = validateContactEmail(contactEmail);
  if (emailError) {
    return NextResponse.json(emailError, { status: 400 });
  }

  const merchantError = validateMerchantId(cngMerchantId);
  if (merchantError) {
    return NextResponse.json(merchantError, { status: 400 });
  }

  const endpointError = validateEndpointOverride(cngEndpointOverride);
  if (endpointError) {
    return NextResponse.json(endpointError, { status: 400 });
  }

  const updates: Record<string, string | null> = {
    [SETTINGS_KEYS.businessName]:
      businessName || "Lady Greens Ashes Nursing Concierge",
    [SETTINGS_KEYS.contactEmail]: contactEmail,
    [SETTINGS_KEYS.cngMerchantId]: cngMerchantId,
    [SETTINGS_KEYS.cngEnvironment]:
      cngEnvironment === "prod" ? "prod" : "qa",
    [SETTINGS_KEYS.cngEndpointOverride]: cngEndpointOverride,
  };

  // Only overwrite encrypted secrets when a new value is provided
  if (cngApiKey) updates[SETTINGS_KEYS.cngApiKey] = cngApiKey;
  if (cngWebhookSecret)
    updates[SETTINGS_KEYS.cngWebhookSecret] = cngWebhookSecret;

  let logoPath: string | null = null;

  if (logo instanceof File && logo.size > 0) {
    const logoError = validateLogoFile(logo);
    if (logoError) {
      return NextResponse.json(logoError, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const ext = logoExtensionForMime(logo.type);
    const path = `logos/logo-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await logo.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("lganc-assets")
      .upload(path, buffer, {
        contentType: logo.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { message: `Logo upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("lganc-assets")
      .getPublicUrl(path);

    logoPath = publicUrl.publicUrl;
    updates[SETTINGS_KEYS.logoPath] = logoPath;
  }

  try {
    await upsertSettings(updates);
  } catch (err) {
    console.error("[settings] save failed:", err);
    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : "Failed to save settings",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, logoPath });
}
