import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaInstallTracking } from "@/components/PwaInstallTracking";
import { AppShell } from "./app-shell";
import { Suspense } from "react";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { StartupScripts } from "@/components/layout/startup-scripts";
import { ToastProvider } from "@/components/ui/toast";

const ibmPlexSans = IBM_Plex_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const ibmPlexSerif = IBM_Plex_Serif({
    variable: "--font-serif",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "LekkerLedger | Dashboard",
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

export default function AppRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const gaDebug = process.env.NEXT_PUBLIC_GA_DEBUG === "true";

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <StartupScripts gaId={gaId} gaDebug={gaDebug} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} antialiased selection:bg-[#C47A1C]/30 selection:text-[#C47A1C]`} style={{ overscrollBehaviorY: 'contain' }}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
                    style={{ backgroundColor: "var(--surface-1)", color: "var(--text)", outline: "2px solid var(--primary)", outlineOffset: "2px" }}
                >
                    Skip to content
                </a>
                {/* SPA page view tracking */}
                <Suspense fallback={null}>
                    <AnalyticsPageView />
                </Suspense>
                {/* PWA install tracking */}
                <PwaInstallTracking />
                <ToastProvider>
                    <ThemeProvider>
                        <AppShell>
                            <Suspense fallback={null}>
                                {children}
                            </Suspense>
                        </AppShell>
                    </ThemeProvider>
                </ToastProvider>
            </body>
        </html>
    );
}



