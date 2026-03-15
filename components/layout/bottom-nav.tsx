"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/src/config/app-nav";

interface BottomNavProps {
    readonly onMore?: () => void;
}

export function BottomNav({ onMore }: BottomNavProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--border)] safe-area-pb shadow-[0_-4px_16px_rgba(0,0,0,0.04)]" role="navigation" aria-label="Mobile navigation">
            <div className="flex min-h-[4.5rem] items-center justify-around sm:min-h-[5rem]">
                {MOBILE_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                            className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-all active-scale ${isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                                }`}
                        >
                            <Icon className={`h-4 sm:h-5 w-4 sm:w-5 transition-transform ${isActive ? "fill-[var(--primary)]/20 scale-110" : "hover:scale-105"}`} />
                            <span className="text-[11px] font-black uppercase tracking-[0.08em] leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                {/* Menu button — opens full side drawer */}
                <button
                    onClick={onMore}
                    aria-label="Menu"
                    data-testid="bottom-nav-more"
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[var(--text-muted)] transition-all active-scale"
                >
                    <Menu className="h-4 sm:h-5 w-4 sm:w-5 transition-transform hover:scale-105" />
                    <span className="text-[11px] font-black uppercase tracking-[0.08em] leading-tight">Menu</span>
                </button>
            </div>
        </nav>
    );
}
