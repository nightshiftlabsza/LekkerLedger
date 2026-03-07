import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleWrapper } from "@/components/google-wrapper";
import { ToastProvider } from "@/components/ui/toast";
import { Suspense } from "react";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { PwaInstallTracking } from "@/components/PwaInstallTracking";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { StartupScripts } from "@/components/layout/startup-scripts";

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

export default function RootLayout({
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

        {/* SPA page view tracking — must be wrapped in Suspense (useSearchParams requirement) */}
        <Suspense fallback={null}>
          <AnalyticsPageView />
        </Suspense>

        {/* PWA install tracking (beforeinstallprompt + appinstalled) */}
        <PwaInstallTracking />

        <GoogleWrapper>
          <ThemeProvider>
            <ToastProvider>
              {children}
              <MarketingFooter />
            </ToastProvider>
          </ThemeProvider>
        </GoogleWrapper>
      </body>
    </html>
  );
}


