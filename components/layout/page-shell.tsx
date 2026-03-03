"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SideDrawer } from "@/components/layout/side-drawer";
import { CloudOff } from "lucide-react";
import { useOnlineStatus } from "@/src/app/hooks/useOnlineStatus";

interface PageShellProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export function PageShell({ title, children, actions }: PageShellProps) {
    const isOnline = useOnlineStatus();
    return (
        <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Desktop Navbar / Sidebar rendering is handled by the SideDrawer component internally */}
            {/* But we must mount it. We mount it inside the header for mobile, but on desktop it breaks out of the header via fixed positioning. */}

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

            <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full flex flex-col gap-8">
                {children}
            </main>
        </div>
    );
}
