"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ChevronDown, UserPlus, Banknote } from "lucide-react";
import { Button } from "./ui/button";

export function GlobalCreateFAB() {
    const pathname = usePathname();
    const shouldHideFab = pathname?.startsWith("/onboarding") || 
        pathname?.startsWith("/settings") || 
        pathname?.startsWith("/upgrade") ||
        pathname?.startsWith("/compliance") ||
        pathname?.startsWith("/help") ||
        pathname?.startsWith("/legal");

    if (shouldHideFab) return null;

    return (
        <div className="relative lg:hidden">
            <Link
                href="/employees/new"
                className="fixed bottom-24 right-6 h-[60px] w-[60px] flex items-center justify-center rounded-3xl bg-[var(--primary)] p-0 text-white shadow-[var(--shadow-lg)] transition-all active-scale z-40 hover-lift"
                aria-label="Add Employee"
                data-testid="global-create-fab"
            >
                <Plus className="h-7 w-7 transition-transform" />
            </Link>
        </div>
    );
}

export function GlobalCreateDesktop() {
    return (
        <div className="relative group/create hidden lg:block">
            <Button className="gap-2.5 font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-[var(--shadow-sm)] px-5 active-scale transition-all rounded-2xl h-11">
                <Plus className="h-4 w-4" /> Create
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5 group-hover/create:rotate-180 transition-transform" />
            </Button>

            {/* Dropdown Menu */}
            <div className="absolute top-[calc(100%+0.6rem)] right-0 w-56 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] opacity-0 invisible group-hover/create:opacity-100 group-hover/create:visible transition-all z-50 overflow-hidden flex flex-col p-1.5 translate-y-2 group-hover/create:translate-y-0">
                <Link href="/payroll/new" className="px-4 py-3 rounded-xl hover:bg-[var(--surface-2)] transition-colors flex items-center gap-3 active-scale group/item">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--primary)] group-hover/item:bg-[var(--primary)] group-hover/item:text-white transition-colors">
                        <Banknote className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">Start Pay Period</span>
                </Link>
                <Link href="/employees/new" className="px-4 py-3 rounded-xl hover:bg-[var(--surface-2)] transition-colors flex items-center gap-3 active-scale group/item">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--primary)] group-hover/item:bg-[var(--primary)] group-hover/item:text-white transition-colors">
                        <UserPlus className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">Add Employee</span>
                </Link>
            </div>
        </div>
    );
}
