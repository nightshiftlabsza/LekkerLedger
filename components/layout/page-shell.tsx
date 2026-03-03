"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SideDrawer } from "@/components/layout/side-drawer";
import { CloudOff, X } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useOnlineStatus } from "@/src/app/hooks/useOnlineStatus";

interface PageShellProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export function PageShell({ title, children, actions }: PageShellProps) {
    const isOnline = useOnlineStatus();
    const [bannerDismissed, setBannerDismissed] = React.useState(false);

    // Reset dismissal when connection is restored so banner shows again if offline again
    React.useEffect(() => {
        if (isOnline) setBannerDismissed(false);
    }, [isOnline]);

    const showBanner = !isOnline && !bannerDismissed;

    return (
        <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/brand/logo-light.png" alt="LekkerLedger" width={80} height={24} className="h-6 w-auto block dark:hidden" />
                            <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={80} height={24} className="h-6 w-auto hidden dark:block" />
                            <span className="font-extrabold text-sm uppercase tracking-widest pt-0.5 text-[var(--text-primary)]">{title}</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isOnline && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                                <CloudOff className="h-3 w-3" /> Offline
                            </span>
                        )}
                        {actions}
                    </div>
                </div>
            </header>

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

            <main id="main-content" className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full flex flex-col gap-8 pb-24 lg:pb-8">
                {children}
            </main>

            <BottomNav />
        </div>
    );
}
