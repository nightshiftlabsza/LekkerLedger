"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/src/config/app-nav";

interface BottomNavProps {
    onMore?: () => void;
}

export function BottomNav({ onMore }: BottomNavProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--border)] safe-area-pb shadow-[0_-4px_16px_rgba(0,0,0,0.04)]" role="navigation" aria-label="Mobile navigation">
            <div className="flex items-center justify-around h-14 sm:h-16">
                {MOBILE_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 sm:gap-1 transition-all active-scale min-w-0 ${isActive ? "text-[var(--primary)]" : "text[var(--text-muted)]"
                                }`}
                        >
                            <Icon className={`h-4 sm:h-5 w-4 sm:w-5 transition-transform ${isActive ? "fill-[var(--primary)]/20 scale-110" : "hover:scale-105"}`} />
                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.08em] sm:tracking-[0.12em] leading-tight">
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
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 sm:gap-1 text-[var(--text-muted)] transition-all active-scale min-w-0"
                >
                    <Menu className="h-4 sm:h-5 w-4 sm:w-5 transition-transform hover:scale-105" />
                    <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.08em] sm:tracking-[0.12em] leading-tight">Menu</span>
                </button>
            </div>
        </nav>
    );
}
