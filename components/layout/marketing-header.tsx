"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/storage";

const NAV_LINKS = [
    { href: "#how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/rules", label: "Compliance guide" },
] as const;

export function MarketingHeader() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = React.useState(false);

    const handleCta = async () => {
        try {
            const s = await getSettings();
            if (!s.employerName) {
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
        } catch {
            router.push("/onboarding");
        }
    };

    // Close on Escape
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Prevent body scroll when mobile menu is open
    React.useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    return (
        <header className="sticky top-0 z-30 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 py-4 xl:py-5">
                {/* Logo */}
                <Link href="/" className="focus-ring rounded-lg shrink-0">
                    <Image src="/brand/logo-light.png" alt="LekkerLedger" width={200} height={50} className="h-10 sm:h-12 w-auto block dark:hidden" priority />
                    <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={200} height={50} className="h-10 sm:h-12 w-auto hidden dark:block" priority />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--amber-500)] hover:underline underline-offset-4 transition-all"
                        >
                            {label}
                        </Link>
                    ))}
                    <Button
                        className="font-black px-6 rounded-xl h-11 shadow-lg active-scale"
                        style={{ backgroundColor: "var(--color-brand)", color: "white" }}
                        onClick={handleCta}
                    >
                        Create your first payslip <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </nav>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:bg-[var(--bg-subtle)] active-scale text-[var(--text-secondary)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Mobile menu overlay */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)} />

                    {/* Menu panel */}
                    <div className="absolute top-0 left-0 right-0 glass-panel shadow-[var(--shadow-xl)] animate-slide-down border-b border-[var(--border-subtle)]">
                        <div className="flex items-center justify-between px-4 py-4">
                            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg">
                                <Image src="/brand/logo-light.png" alt="LekkerLedger" width={160} height={40} className="h-9 w-auto block dark:hidden" priority />
                                <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={160} height={40} className="h-9 w-auto hidden dark:block" priority />
                            </Link>
                            <button
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[var(--bg-subtle)] active-scale"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <nav className="px-4 pb-6 space-y-1">
                            {NAV_LINKS.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    {label}
                                </Link>
                            ))}
                            <div className="pt-3">
                                <Button
                                    className="w-full font-black h-12 rounded-xl shadow-lg active-scale"
                                    style={{ backgroundColor: "var(--color-brand)", color: "white" }}
                                    onClick={() => { setMenuOpen(false); handleCta(); }}
                                >
                                    Create your first payslip <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
