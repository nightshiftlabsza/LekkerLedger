import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { StartupScripts } from "@/components/layout/startup-scripts";
import { Suspense } from "react";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { PwaInstallTracking } from "@/components/PwaInstallTracking";
import { ROOT_METADATA_BASE } from "@/lib/seo";

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
  metadataBase: ROOT_METADATA_BASE,
  title: "LekkerLedger | Household Payroll, Records, and Annual Paperwork",
  description:
    "Run South African household payroll with payslips, employee records, backup, and annual paperwork in one calm workspace.",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
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
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} antialiased selection:bg-[#C47A1C]/30 selection:text-[#C47A1C]`}
        style={{ overscrollBehaviorY: "contain" }}
      >
        <Suspense fallback={null}>
          <AnalyticsPageView />
        </Suspense>
        <PwaInstallTracking />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
