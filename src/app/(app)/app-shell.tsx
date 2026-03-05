"use client";

import * as React from "react";
import Link from "next/link";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { GlobalCreateDesktop, GlobalCreateFAB } from "@/components/global-create";
import { CloudOff, X, AlertOctagon, CreditCard } from "lucide-react";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { ToastProvider } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";

export function AppShell({ children }: { children: React.ReactNode }) {
    const { network, sync, payments } = useAppConnectivity();
    const [offlineBannerDismissed, setOfflineBannerDismissed] = React.useState(false);
    const [syncBannerDismissed, setSyncBannerDismissed] = React.useState(false);
    const [paymentsBannerDismissed, setPaymentsBannerDismissed] = React.useState(false);
    const [moreOpen, setMoreOpen] = React.useState(false);

    React.useEffect(() => {
        if (network === "online") setOfflineBannerDismissed(false);
    }, [network]);

    const showOfflineBanner = network === "offline" && !offlineBannerDismissed;
    const showSyncBanner = network === "online" && sync === "error" && !syncBannerDismissed;
    const showPaymentsBanner = network === "online" && payments === "unavailable" && !paymentsBannerDismissed;

    return (
        <ToastProvider>
            <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg)" }}>
                {/* Side drawer — always present on desktop, overlay on mobile */}
                {/* Side drawer — always present on desktop, overlay on mobile */}
                {/* Removed duplicate SideDrawer. Mobile one handles both. */}

                {/* Top bar */}
                <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)]">
                    <div className="content-container w-full flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            {/* Mobile menu trigger — opens side drawer */}
                            <SideDrawer open={moreOpen} onOpenChange={setMoreOpen} showButton={true} />
                            <Link href="/dashboard" className="flex items-center gap-2 outline-none hover:opacity-90 transition-opacity">
                                <Logo />
                            </Link>
                            {/* Desktop only Household switcher */}
                            <div className="hidden lg:block ml-4 pl-4 border-l border-[var(--border)]">
                                {/* Static mock data for now, would be dynamically fed by auth/storage */}
                                <HouseholdSwitcher
                                    households={[{ id: "1", name: "My Home" }]}
                                    activeId="1"
                                    isPro={false}
                                    onSwitch={() => { }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {network === "offline" && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[10px] font-bold text-[var(--focus)] border border-[var(--focus)]/20">
                                    <CloudOff className="h-3 w-3" /> Offline
                                </span>
                            )}
                            <GlobalCreateDesktop />
                        </div>
                    </div>
                </header>

                {/* Offline banner */}
                {showOfflineBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold"
                        style={{ backgroundColor: "rgba(217,119,6,0.10)", borderBottom: "1px solid rgba(217,119,6,0.25)", color: "var(--primary)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CloudOff className="h-4 w-4 shrink-0" />
                                <span>You&apos;re offline — your changes are saved locally and will sync when reconnected.</span>
                            </div>
                            <button
                                onClick={() => setOfflineBannerDismissed(true)}
                                aria-label="Dismiss offline notice"
                                className="shrink-0 rounded p-0.5 hover:bg-[var(--primary)]/20 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Sync Error banner */}
                {showSyncBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold bg-red-50 text-red-600 border-b border-red-200">
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <AlertOctagon className="h-4 w-4 shrink-0" />
                                <span>Google Drive sync failed. Please check your connection or reconnect Drive in Settings.</span>
                            </div>
                            <button
                                onClick={() => setSyncBannerDismissed(true)}
                                aria-label="Dismiss sync notice"
                                className="shrink-0 rounded p-0.5 hover:bg-red-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Payments Error banner */}
                {showPaymentsBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold bg-red-50 text-red-600 border-b border-red-200">
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 shrink-0" />
                                <span>Payments system currently unavailable. Check back later.</span>
                            </div>
                            <button
                                onClick={() => setPaymentsBannerDismissed(true)}
                                aria-label="Dismiss payments notice"
                                className="shrink-0 rounded p-0.5 hover:bg-red-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main id="main-content" className="flex-1 py-8 content-container w-full flex flex-col gap-8 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8">
                    {children}
                </main>

                {/* Global FAB (Mobile) */}
                <GlobalCreateFAB />

                {/* Bottom nav (mobile) */}
                <BottomNav onMore={() => setMoreOpen(true)} />
            </div>
        </ToastProvider>
    );
}
