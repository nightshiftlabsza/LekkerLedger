"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Banknote, FolderOpen, MoreHorizontal } from "lucide-react";

const NAV_ITEMS = [
    { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Payroll", icon: Banknote, href: "/payroll" },
    { label: "Employees", icon: Users, href: "/employees" },
    { label: "Documents", icon: FolderOpen, href: "/documents" },
];

interface BottomNavProps {
    onMore?: () => void;
}

export function BottomNav({ onMore }: BottomNavProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--border)] pb-safe">
            <div className="flex items-center justify-around h-16">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
                {/* More button — opens full side drawer */}
                <button
                    onClick={onMore}
                    className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-[var(--text-muted)] transition-colors"
                >
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="text-[11px] font-bold uppercase tracking-tight">More</span>
                </button>
            </div>
        </nav>
    );
}
