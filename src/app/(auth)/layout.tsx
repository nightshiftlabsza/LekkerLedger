import * as React from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { PwaInstallTracking } from "@/components/PwaInstallTracking";
import { StartupScripts } from "@/components/layout/startup-scripts";
import { Logo } from "@/components/ui/logo";

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
    title: "Account Access | LekkerLedger",
    description: "Log in, create your account, or reset your password for LekkerLedger.",
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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const gaDebug = process.env.NEXT_PUBLIC_GA_DEBUG === "true";

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <StartupScripts gaId={gaId} gaDebug={gaDebug} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} antialiased selection:bg-[#C47A1C]/30 selection:text-[#C47A1C]`}>
                <ThemeProvider>
                    <ToastProvider>
                        <Suspense fallback={null}>
                            <AnalyticsPageView />
                        </Suspense>
                        <PwaInstallTracking />

                        <div className="min-h-screen bg-[var(--bg)]">
                            <a
                                href="#main-content"
                                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
                                style={{ backgroundColor: "var(--surface-1)", color: "var(--text)", outline: "2px solid var(--primary)", outlineOffset: "2px" }}
                            >
                                Skip to content
                            </a>

                            <header className="border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
                                <div className="content-container-wide flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                                    <Link
                                        href="/"
                                        className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to home
                                    </Link>
                                    <Logo iconClassName="h-10 w-10 sm:h-11 sm:w-11" textClassName="text-[1.15rem] sm:text-[1.3rem]" className="gap-2.5" />
                                </div>
                            </header>

                            <main id="main-content" className="content-container-wide px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
                                <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,32rem)] xl:items-start">
                                    <section
                                        className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] px-6 py-7 shadow-[var(--shadow-sm)] sm:px-8 sm:py-9 lg:px-10"
                                        style={{ background: "linear-gradient(180deg, rgba(0, 122, 77, 0.06) 0%, rgba(196, 122, 28, 0.04) 100%)" }}
                                    >
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                            Secure account access
                                        </div>
                                        <h1 className="type-h1 mt-6 max-w-[14ch] text-[var(--text)]">
                                            Paid access, recovery, and setup in one calm flow.
                                        </h1>
                                        <p className="mt-4 measure-readable text-base leading-7 text-[var(--text-muted)]">
                                            Use this area to log in, create the paid account that holds your encrypted sync, or reset your password. The screen stays simple on mobile and gives more context on wider layouts without turning into a stretched form.
                                        </p>

                                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                                            <AuthLayoutNote
                                                title="Clear next step"
                                                body="Each page keeps one main action so the post-payment path stays easy to follow."
                                            />
                                            <AuthLayoutNote
                                                title="Recovery ready"
                                                body="After login, later devices ask for your recovery key before records unlock."
                                            />
                                            <AuthLayoutNote
                                                title="No pop-up detours"
                                                body="Login, signup, and reset stay inside the browser tab instead of opening a separate auth window."
                                            />
                                        </div>
                                    </section>

                                    <div className="w-full xl:sticky xl:top-6">
                                        <Suspense fallback={null}>
                                            {children}
                                        </Suspense>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

function AuthLayoutNote({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
        </div>
    );
}
