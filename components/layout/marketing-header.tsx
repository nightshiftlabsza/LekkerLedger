"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const NAV_LINKS = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/trust", label: "Trust" },
    { href: "/rules", label: "Compliance guide" },
    { href: "/#faq", label: "FAQ" },
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
        <header className="sticky top-0 z-30 glass-panel shadow-[var(--shadow-1)]" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="content-container-wide flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="rounded-lg py-1">
                    <Logo />
                </Link>

                <nav className="hidden lg:flex items-center gap-8">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden lg:flex items-center gap-3">
                    <Link href="/open-app" className="text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]">
                        Open app
                    </Link>
                    <Link href="/onboarding">
                        <Button className="h-11 rounded-xl px-6 font-bold shadow-[var(--shadow-1)]">
                            Start free <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <button
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
                    <div className="absolute inset-x-0 top-0 border-b border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-2)]">
                        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg py-1">
                                <Logo />
                            </Link>
                            <button
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <nav className="space-y-1 px-4 pb-4 sm:px-6">
                            {NAV_LINKS.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-raised)]"
                                >
                                    {label}
                                </Link>
                            ))}
                            <div className="grid grid-cols-1 gap-2 border-t border-[var(--border)] pt-4">
                                <Link href="/open-app" onClick={() => setMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-center font-bold">
                                        Open app
                                    </Button>
                                </Link>
                                <Link href="/onboarding" onClick={() => setMenuOpen(false)}>
                                    <Button className="w-full justify-center font-bold">
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
