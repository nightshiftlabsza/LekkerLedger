import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { AuthModal } from "@/components/auth/auth-modal";
import { AuthStateProvider } from "@/components/auth/auth-state-provider";
import { JsonLd, organizationSchema, softwareApplicationSchema } from "@/components/seo/json-ld";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initialUser = user
    ? {
        id: user.id,
        email: user.email ?? null,
      }
    : null;

  return (
    <AuthStateProvider initialUser={initialUser}>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={softwareApplicationSchema} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
        style={{ backgroundColor: "var(--surface-1)", color: "var(--text)", outline: "2px solid var(--primary)", outlineOffset: "2px" }}
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
