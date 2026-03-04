"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { GlobalCreateDesktop, GlobalCreateFAB } from "@/components/global-create";
import { CloudOff, X } from "lucide-react";
import { useOnlineStatus } from "@/src/app/hooks/useOnlineStatus";
import { ToastProvider } from "@/components/ui/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
    const isOnline = useOnlineStatus();
    const [bannerDismissed, setBannerDismissed] = React.useState(false);
    const [moreOpen, setMoreOpen] = React.useState(false);

    React.useEffect(() => {
        if (isOnline) setBannerDismissed(false);
    }, [isOnline]);

    const showBanner = !isOnline && !bannerDismissed;

    return (
        <ToastProvider>
            <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
                {/* Side drawer — always present on desktop, overlay on mobile */}
                {/* Side drawer — always present on desktop, overlay on mobile */}
                {/* Removed duplicate SideDrawer. Mobile one handles both. */}

                {/* Top bar */}
                <header className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between glass-panel border-b border-[var(--border-subtle)]">
                    <div className="content-container w-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Mobile menu trigger — opens side drawer */}
                            <SideDrawer showButton={true} />
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Image src="/brand/logo-light.png" alt="LekkerLedger" width={80} height={24} className="h-6 w-auto block dark:hidden" />
                                <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={80} height={24} className="h-6 w-auto hidden dark:block" />
                            </Link>
                            {/* Desktop only Household switcher */}
                            <div className="hidden lg:block ml-4 pl-4 border-l border-[var(--border-subtle)]">
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
                            {!isOnline && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                                    <CloudOff className="h-3 w-3" /> Offline
                                </span>
                            )}
                            <GlobalCreateDesktop />
                        </div>
                    </div>
                </header>

                {/* Offline banner */}
                {showBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold"
                        style={{ backgroundColor: "rgba(217,119,6,0.10)", borderBottom: "1px solid rgba(217,119,6,0.25)", color: "var(--amber-500)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CloudOff className="h-4 w-4 shrink-0" />
                                <span>You&apos;re offline — your changes are saved locally and will sync when reconnected.</span>
                            </div>
                            <button
                                onClick={() => setBannerDismissed(true)}
                                aria-label="Dismiss offline notice"
                                className="shrink-0 rounded p-0.5 hover:bg-amber-500/20 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main id="main-content" className="flex-1 px-4 py-8 content-container w-full flex flex-col gap-8 pb-24 lg:pb-8">
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
