"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

export function GlobalCreateFAB() {
    return (
        <div className="relative group/fab lg:hidden">
            <Button
                className="fixed bottom-20 right-4 h-[56px] w-[56px] justify-center rounded-2xl bg-[var(--amber-500)] text-white shadow-lg hover:bg-[var(--amber-600)] hover:scale-105 transition-all z-40 p-0 flex flex-col items-center font-bold"
                aria-label="Create new"
            >
                <Plus className="h-6 w-6" />
            </Button>
            !
            {/* Expanded actions on hover/focus */}
            <div className="fixed bottom-36 right-4 flex flex-col items-end gap-3 opacity-0 invisible group-hover/fab:opacity-100 group-hover/fab:visible group-focus-within/fab:opacity-100 group-focus-within/fab:visible transition-all translate-y-2 group-hover/fab:translate-y-0 z-40">
                <Link href="/payroll" className="flex items-center gap-3 active:scale-95 transition-transform">
                    <span className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded shadow backdrop-blur-sm">Start Pay Period</span>
                    <div className="h-10 w-10 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center text-[var(--amber-500)] border border-[var(--border-subtle)]"><Plus className="h-5 w-5" /></div>
                </Link>
                <Link href="/employees/new" className="flex items-center gap-3 active:scale-95 transition-transform">
                    <span className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded shadow backdrop-blur-sm">Add Employee</span>
                    <div className="h-10 w-10 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center text-[var(--amber-500)] border border-[var(--border-subtle)]"><Plus className="h-5 w-5" /></div>
                </Link>
            </div>
        </div>
    );
}

export function GlobalCreateDesktop() {
    return (
        <div className="relative group/create hidden lg:block">
            <Button className="gap-2 font-bold bg-[var(--amber-500)] text-white hover:bg-[var(--amber-600)] shadow-sm px-4">
                <Plus className="h-4 w-4" /> Create
                <ChevronDown className="h-3 w-3 opacity-70 ml-1" />
            </Button>

            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-xl opacity-0 invisible group-focus-within/create:opacity-100 group-focus-within/create:visible group-hover/create:opacity-100 group-hover/create:visible transition-all z-50 overflow-hidden flex flex-col">
                <div className="p-1 flex flex-col text-sm font-medium">
                    <Link href="/payroll" className="px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors flex items-center gap-2">
                        Start Pay Period
                    </Link>
                    <Link href="/employees/new" className="px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors flex items-center gap-2">
                        Add Employee
                    </Link>
                </div>
            </div>
        </div>
    );
}
