"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
    const [accountMenuOpen, setAccountMenuOpen] = React.useState(false);
    const accountMenuRef = React.useRef<HTMLDivElement | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuthState();

    const openLogin = React.useCallback(() => {
        setMenuOpen(false);
        setAccountMenuOpen(false);
        router.push(`${pathname}?auth=login`, { scroll: false });
    }, [pathname, router]);

    const handleSignOut = React.useCallback(async () => {
        setMenuOpen(false);
        setAccountMenuOpen(false);
        await signOut();
        router.refresh();
    }, [router, signOut]);

    React.useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setAccountMenuOpen(false);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    React.useEffect(() => {
        if (!accountMenuOpen) {
            return undefined;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!accountMenuRef.current?.contains(event.target as Node)) {
                setAccountMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [accountMenuOpen]);

    React.useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    return (
        <header className="sticky top-0 z-30 bg-[var(--bg)] shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="marketing-shell flex items-center justify-between py-4">
                <Link href="/" className="inline-flex min-h-[44px] items-center rounded-lg py-1">
                    <Logo />
                </Link>

                <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
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
                            <Link
                                href="/dashboard"
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,122,77,0.18)] transition-all hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <AccountMenu
                                ref={accountMenuRef}
                                email={user.email}
                                open={accountMenuOpen}
                                onToggle={() => setAccountMenuOpen((current) => !current)}
                                onClose={() => setAccountMenuOpen(false)}
                                onSignOut={handleSignOut}
                            />
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={openLogin}
                            className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--text)] transition-colors hover:text-[var(--primary)]"
                        >
                            Log in
                        </button>
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
                        <div className="marketing-shell flex items-center justify-between py-4">
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

                        <nav className="marketing-shell space-y-1 pb-6">
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

                            <div className="mt-2 grid grid-cols-1 gap-2 border-t border-[var(--border)] pt-6">
                                {user ? (
                                    <>
                                        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/6 px-4 py-3 text-left shadow-[0_1px_4px_rgba(0,122,77,0.08)]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                                                    <span className="text-sm font-bold leading-none">{user.email ? user.email.charAt(0).toUpperCase() : "A"}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">Account</p>
                                                    <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text)]">{user.email ?? "Paid account connected"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMenuOpen(false)}
                                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,122,77,0.18)] transition-all hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]"
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            Go to Dashboard
                                        </Link>
                                        <Button variant="ghost" className="h-12 w-full justify-center font-bold text-[var(--text-muted)]" onClick={handleSignOut}>
                                            Sign out
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="ghost" className="h-12 w-full justify-center font-bold text-[var(--text)]" onClick={openLogin}>
                                        Log in
                                    </Button>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}

const AccountMenu = React.forwardRef<HTMLDivElement, {
    email: string | null;
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSignOut: () => Promise<void>;
}>(
    ({ email, open, onToggle, onClose, onSignOut }, ref) => (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="inline-flex min-h-[44px] items-center gap-2.5 rounded-2xl border border-[var(--primary)]/25 bg-[var(--primary)]/8 px-3.5 py-2 text-left shadow-[0_1px_4px_rgba(0,122,77,0.10)] transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
            >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                    <span className="text-xs font-bold leading-none">{email ? email.charAt(0).toUpperCase() : "A"}</span>
                </div>
                <p className="max-w-[11rem] truncate text-sm font-semibold text-[var(--primary)]">
                    {email ?? "Paid account"}
                </p>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--primary)]/60 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open ? (
                <div
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-[13rem] rounded-[16px] border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-[0_18px_45px_rgba(16,24,40,0.16)]"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={onSignOut}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-raised)]"
                    >
                        <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
                        Sign out
                    </button>
                </div>
            ) : null}
        </div>
    ),
);

AccountMenu.displayName = "AccountMenu";
