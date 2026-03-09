"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ChevronDown, UserPlus, Banknote } from "lucide-react";
import { Button } from "./ui/button";

export function GlobalCreateFAB() {
    const [open, setOpen] = React.useState(false);
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
            {/* Overlay for closing when open */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-fade-in"
                    onClick={() => setOpen(false)}
                />
            )}

            <Button
                onClick={() => setOpen(!open)}
                className={`fixed bottom-24 right-6 h-[60px] w-[60px] justify-center rounded-3xl bg-[var(--primary)] p-0 text-white shadow-[var(--shadow-lg)] transition-all active-scale z-40 flex flex-col items-center hover-lift ${open ? 'rotate-[135deg] bg-[var(--text)]' : ''}`}
                aria-label="Create new"
                data-testid="global-create-fab"
            >
                <Plus className="h-7 w-7 transition-transform" />
            </Button>

            {/* Expanded actions */}
            <div className={`fixed bottom-[170px] right-6 flex flex-col items-end gap-4 transition-all z-40 ${open ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-8 invisible'}`}>
                <Link
                    href="/payroll/new"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 active-scale transition-all"
                    data-testid="global-create-start-payroll"
                >
                    <span className="bg-[var(--surface-raised)] text-[var(--text)] text-[10px] font-black uppercase tracking-[0.16em] px-4 py-2.5 rounded-2xl shadow-[var(--shadow-md)] border border-[var(--border)]">Start Pay Period</span>
                    <div className="h-14 w-14 bg-[var(--surface-raised)] rounded-2xl shadow-[var(--shadow-md)] flex items-center justify-center text-[var(--primary)] border border-[var(--border)] hover-lift">
                        <Banknote className="h-6 w-6" />
                    </div>
                </Link>
                <Link
                    href="/employees/new"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 active-scale transition-all"
                    data-testid="global-create-add-employee"
                >
                    <span className="bg-[var(--surface-raised)] text-[var(--text)] text-[10px] font-black uppercase tracking-[0.16em] px-4 py-2.5 rounded-2xl shadow-[var(--shadow-md)] border border-[var(--border)]">Add Employee</span>
                    <div className="h-14 w-14 bg-[var(--surface-raised)] rounded-2xl shadow-[var(--shadow-md)] flex items-center justify-center text-[var(--primary)] border border-[var(--border)] hover-lift">
                        <UserPlus className="h-6 w-6" />
                    </div>
                </Link>
            </div>
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
