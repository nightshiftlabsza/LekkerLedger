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
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--border)] pb-safe">
            <div className="flex items-center justify-around h-16">
                {MOBILE_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                                }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? "fill-[var(--primary)]/20" : ""}`} />
                            <span className="text-[11px] font-bold uppercase tracking-tight">
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
                    className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-[var(--text-muted)] transition-colors"
                >
                    <Menu className="h-5 w-5" />
                    <span className="text-[11px] font-bold uppercase tracking-tight">Menu</span>
                </button>
            </div>
        </nav>
    );
}
