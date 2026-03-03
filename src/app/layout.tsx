import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleWrapper } from "@/components/google-wrapper";
import { SplashPortal } from "@/components/ui/splash-portal";
import { ToastProvider } from "@/components/ui/toast";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LekkerLedger | SA Domestic Worker Payslips",
  description:
    "Create a compliant payslip in under 90 seconds. Fast, reliable, and proudly South African.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#c47a1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = "G-77MEDHHX58";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&display=swap"
          rel="stylesheet"
        />
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
                }catch(e){
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-amber-500/30 selection:text-amber-200`} style={{ overscrollBehaviorY: 'contain' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
          style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", outline: "2px solid var(--amber-500)", outlineOffset: "2px" }}
        >
          Skip to content
        </a>
        <GoogleWrapper>
          <ThemeProvider>
            <ToastProvider>
              <SplashPortal />
              {children}
            </ToastProvider>
          </ThemeProvider>
        </GoogleWrapper>
      </body>
    </html>
  );
}
