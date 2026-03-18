import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { AuthModal } from "@/components/auth/auth-modal";
import { AuthStateProvider } from "@/components/auth/auth-state-provider";
import { JsonLd, organizationSchema, softwareApplicationSchema } from "@/components/seo/json-ld";
import { buildE2EAuthUserSnapshot } from "@/lib/e2e-billing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "LekkerLedger | Household Payroll, Records, and Annual Paperwork",
  description:
    "Run South African household payroll with payslips, employee records, backup, and annual paperwork in one calm workspace.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#c47a1c",
  width: "device-width",
  initialScale: 1,
};

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hasE2EBypass =
    process.env.E2E_BYPASS_AUTH === "1"
    && cookieStore.get("ll-e2e-auth-bypass")?.value === "1";
  let initialUser = null;
  if (user) {
    initialUser = {
        id: user.id,
        email: user.email ?? null,
      };
  } else if (hasE2EBypass) {
    initialUser = buildE2EAuthUserSnapshot();
  }

  return (
    <AuthStateProvider initialUser={initialUser} lockInitialUser={hasE2EBypass}>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={softwareApplicationSchema} />
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>
      <Suspense fallback={null}>
        {children}
      </Suspense>
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
      <MarketingFooter />
    </AuthStateProvider>
  );
}
