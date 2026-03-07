"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ChevronDown, UserPlus, Banknote } from "lucide-react";
import { Button } from "./ui/button";

export function GlobalCreateFAB() {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();
    const shouldHideFab = pathname?.startsWith("/onboarding") || pathname?.startsWith("/settings");

    if (shouldHideFab) return null;

    return (
        <div className="relative lg:hidden">
            {/* Overlay for closing when open */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 animate-in fade-in transition-all"
                    onClick={() => setOpen(false)}
                />
            )}

            <Button
                onClick={() => setOpen(!open)}
                className={`fixed bottom-20 right-4 h-[56px] w-[56px] justify-center rounded-2xl bg-[var(--primary)] p-0 text-white shadow-lg transition-all hover:bg-[var(--primary-hover)] z-40 flex flex-col items-center font-bold ${open ? 'rotate-45 bg-[var(--text)]' : ''}`}
                aria-label="Create new"
                data-testid="global-create-fab"
            >
                <Plus className="h-6 w-6" />
            </Button>

            {/* Expanded actions */}
            <div className={`fixed bottom-[136px] right-4 flex flex-col items-end gap-3 transition-all z-40 ${open ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-4 invisible'}`}>
                <Link
                    href="/payroll/new"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 active:scale-95 transition-transform"
                    data-testid="global-create-start-payroll"
                >
                    <span className="bg-[var(--bg-elevated)] text-[var(--text)] text-[11px] font-bold tracking-wide px-3 py-2 rounded-xl shadow-xl border border-[var(--border)]">Start Pay Period</span>
                    <div className="h-12 w-12 bg-[var(--surface-1)] rounded-2xl shadow-xl flex items-center justify-center text-[var(--primary)] border border-[var(--border)]">
                        <Banknote className="h-5 w-5" />
                    </div>
                </Link>
                <Link
                    href="/employees/new"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 active:scale-95 transition-transform"
                    data-testid="global-create-add-employee"
                >
                    <span className="bg-[var(--bg-elevated)] text-[var(--text)] text-[11px] font-bold tracking-wide px-3 py-2 rounded-xl shadow-xl border border-[var(--border)]">Add Employee</span>
                    <div className="h-12 w-12 bg-[var(--surface-1)] rounded-2xl shadow-xl flex items-center justify-center text-[var(--primary)] border border-[var(--border)]">
                        <UserPlus className="h-5 w-5" />
                    </div>
                </Link>
            </div>
        </div>
    );
}

export function GlobalCreateDesktop() {
    return (
        <div className="relative group/create hidden lg:block">
            <Button className="gap-2 font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm px-4">
                <Plus className="h-4 w-4" /> Create
                <ChevronDown className="h-3 w-3 opacity-70 ml-1" />
            </Button>

            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl shadow-xl opacity-0 invisible group-focus-within/create:opacity-100 group-focus-within/create:visible group-hover/create:opacity-100 group-hover/create:visible transition-all z-50 overflow-hidden flex flex-col">
                <div className="p-1 flex flex-col text-sm font-medium">
                    <Link href="/payroll/new" className="px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2">
                        Start Pay Period
                    </Link>
                    <Link href="/employees/new" className="px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2">
                        Add Employee
                    </Link>
                </div>
            </div>
        </div>
    );
}
