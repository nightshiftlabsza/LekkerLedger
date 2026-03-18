import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { AppShell } from "./app-shell";
import { Suspense } from "react";
import { AppRouteTitleSync } from "@/components/app-route-title-sync";
import { AuthStateProvider } from "@/components/auth/auth-state-provider";
import { buildE2EAuthUserSnapshot } from "@/lib/e2e-billing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: {
        default: "Workspace | LekkerLedger",
        template: "%s | LekkerLedger",
    },
    description:
        "Manage payslips, leave tracking, and household employment records in one place.",
    manifest: "/manifest.webmanifest",
    robots: {
        index: false,
        follow: true,
    },
};

export const viewport: Viewport = {
    themeColor: "#c47a1c",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    minimumScale: 1,
    maximumScale: 5,
    userScalable: true,
};

export default async function AppRootLayout({
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
            <a
                href="#main-content"
                className="skip-link"
            >
                Skip to content
            </a>
            <Suspense fallback={null}>
                <AppShell>
                    <AppRouteTitleSync />
                    {children}
                </AppShell>
            </Suspense>
        </AuthStateProvider>
    );
}
