"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const NAV_LINKS = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/resources/tools/domestic-worker-payslip", label: "Payslip Generator" },
    { href: "/calculator", label: "Wage calculator" },
    { href: "/resources/checklists/household-employer-monthly", label: "Employer Checklist" },
    { href: "/pricing", label: "Pricing" },
] as const;

export function MarketingHeader() {
    const [menuOpen, setMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    React.useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    return (
        <header className="sticky top-0 z-30 bg-[var(--bg)] shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="content-container-wide flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="rounded-lg py-1">
                    <Logo />
                </Link>

                <nav className="hidden lg:flex items-center gap-8">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={`${href}-${label}`}
                            href={href}
                            className="text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden lg:flex items-center gap-3">
                    <Link href="/?auth=login" className="text-sm font-bold text-[var(--text)] hover:text-[var(--primary)] px-3 transition-colors">
                        Login (Paid users)
                    </Link>
                    <Link href="/dashboard">
                        <Button className="h-11 rounded-xl px-6 font-bold shadow-[var(--shadow-sm)] active:scale-[0.98]">
                            Start free <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <button
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    className="lg:hidden flex h-12 w-12 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
                    <div className="absolute inset-x-0 top-0 border-b border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-lg)] animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg py-1">
                                <Logo />
                            </Link>
                            <button
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <nav className="space-y-1 px-4 pb-6 sm:px-6">
                            {NAV_LINKS.map(({ href, label }) => (
                                <Link
                                    key={`${href}-${label}`}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-raised)]"
                                >
                                    {label}
                                </Link>
                            ))}
                            <div className="grid grid-cols-1 gap-2 border-t border-[var(--border)] pt-6 mt-2">
                                <Link href="/?auth=login" onClick={() => setMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-center font-bold text-[var(--text)]">
                                        Login (Paid users)
                                    </Button>
                                </Link>
                                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                                    <Button className="w-full justify-center font-bold h-12">
                                        Start free <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
