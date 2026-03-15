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
        <nav
            className="mobile-bottom-nav safe-area-pl safe-area-pr fixed bottom-0 left-0 right-0 z-40 lg:hidden"
            role="navigation"
            aria-label="Mobile navigation"
        >
            <div className="mobile-bottom-nav__grid">
                {MOBILE_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                            data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                            className={`mobile-bottom-nav__item flex h-full flex-col items-center justify-center gap-1 rounded-[1.25rem] transition-all active-scale ${
                                isActive
                                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                    : "text-[var(--text-muted)]"
                            }`}
                        >
                            <Icon className={`h-[1.15rem] w-[1.15rem] transition-transform ${isActive ? "scale-110" : "hover:scale-105"}`} />
                            <span className="mobile-bottom-nav__label">{item.label}</span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={onMore}
                    aria-label="Menu"
                    data-testid="bottom-nav-more"
                    className="mobile-bottom-nav__item flex h-full flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[var(--text-muted)] transition-all active-scale"
                >
                    <Menu className="h-[1.15rem] w-[1.15rem] transition-transform hover:scale-105" />
                    <span className="mobile-bottom-nav__label">Menu</span>
                </button>
            </div>
        </nav>
    );
}
