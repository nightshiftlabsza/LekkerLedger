import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleWrapper } from "@/components/google-wrapper";
import { PwaInstallTracking } from "@/src/components/PwaInstallTracking";
import { AppShell } from "./app-shell";
import { Suspense } from "react";
import { AnalyticsPageView } from "@/src/components/AnalyticsPageView";

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
        "Manage your domestic worker payroll, leave, and compliance — all in one place.",
    manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
    themeColor: "#c47a1c",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function AppRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // TODO: remove debug_mode once events are confirmed in GA4 DebugView
    const gaId = process.env.NEXT_PUBLIC_GA_ID;

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { debug_mode: true, send_page_view: true });
            `,
                    }}
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* Inline script — applies correct theme before first paint to avoid flash */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function(){
                try{
                  var stored = localStorage.getItem('ll-theme');
                  var theme = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.setAttribute('data-theme', resolved);
                  
                  var storedDensity = localStorage.getItem('ll-density');
                  if (storedDensity === 'compact') {
                     document.documentElement.classList.add('density-compact');
                  } else {
                     document.documentElement.classList.remove('density-compact');
                  }
                }catch(e){
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.remove('density-compact');
                }
              })();
            `,
                    }}
                />
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
                <GoogleWrapper>
                    <ThemeProvider>
                        <AppShell>{children}</AppShell>
                    </ThemeProvider>
                </GoogleWrapper>
            </body>
        </html>
    );
}
