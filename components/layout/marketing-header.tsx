"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/components/auth/auth-state-provider";
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
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthState();

    const openLogin = React.useCallback(() => {
        setMenuOpen(false);
        router.push(`${pathname}?auth=login`, { scroll: false });
    }, [pathname, router]);

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
                <Link href="/" className="inline-flex min-h-[44px] items-center rounded-lg py-1">
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
                    {user ? (
                        <>
                            <div className="max-w-[16rem] rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-right shadow-[var(--shadow-sm)]">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Signed in</p>
                                <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{user.email ?? "Paid account connected"}</p>
                            </div>
                            <Link href="/dashboard" className="inline-flex min-h-[44px] items-stretch">
                                <Button className="h-11 rounded-xl px-6 font-bold shadow-[var(--shadow-sm)] active:scale-[0.98]">
                                    Open dashboard <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={openLogin} className="text-sm font-bold text-[var(--text)] hover:text-[var(--primary)] px-3 transition-colors">
                                Login (Paid users)
                            </button>
                            <Link href="/dashboard" className="inline-flex min-h-[44px] items-stretch">
                                <Button className="h-11 rounded-xl px-6 font-bold shadow-[var(--shadow-sm)] active:scale-[0.98]">
                                    Start free <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    className="lg:hidden flex h-12 w-12 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-raised)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 border-0 bg-black/30 p-0 backdrop-blur-sm"
                        onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute inset-x-0 top-0 border-b border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-lg)] animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                            <Link href="/" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center rounded-lg py-1">
                                <Logo />
                            </Link>
                            <button
                                type="button"
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
                                {user ? (
                                    <>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-left">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Signed in</p>
                                            <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{user.email ?? "Paid account connected"}</p>
                                        </div>
                                        <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-stretch">
                                            <Button className="w-full justify-center font-bold h-12">
                                                Open dashboard <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="ghost" className="w-full justify-center font-bold text-[var(--text)]" onClick={openLogin}>
                                            Login (Paid users)
                                        </Button>
                                        <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-stretch">
                                            <Button className="w-full justify-center font-bold h-12">
                                                Start free <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
