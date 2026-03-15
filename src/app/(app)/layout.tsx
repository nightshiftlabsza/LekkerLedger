import type { Metadata, Viewport } from "next";
import { AppShell } from "./app-shell";
import { Suspense } from "react";
import { AppRouteTitleSync } from "@/components/app-route-title-sync";
import { AuthStateProvider } from "@/components/auth/auth-state-provider";
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
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
                style={{ backgroundColor: "var(--surface-1)", color: "var(--text)", outline: "2px solid var(--primary)", outlineOffset: "2px" }}
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
