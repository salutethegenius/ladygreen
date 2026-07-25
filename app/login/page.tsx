import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  let logoPath: string | null = null;
  try {
    logoPath = (await getAppSettings()).logoPath;
  } catch {
    logoPath = null;
  }

  return <LoginForm logoPath={logoPath} />;
}
