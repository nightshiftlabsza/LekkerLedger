"use client";

import * as React from "react";
import Link from "next/link";
import {
    X,
    FileText,
    Users,
    Home,
    ChevronRight,
    Menu,
    LayoutDashboard,
    Palmtree,
    FileSpreadsheet,
    Settings,
    BookOpen,
    Sparkles,
    Mail,
    Cloud,
} from "lucide-react";


const NAV_LINKS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/leave", label: "Leave Tracker", icon: Palmtree, note: "Select an employee first" },
    { href: "/contracts", label: "Contracts", icon: FileText },
    { href: "/ufiling", label: "uFiling Export", icon: FileSpreadsheet },
    { href: "/rules", label: "SA Rules Guide", icon: BookOpen },
    { href: "/pricing", label: "Support & Pro", icon: Sparkles },
    { href: "/settings?tab=sync", label: "Cloud Sync / Login", icon: Cloud },
    { href: "/settings", label: "Settings & Backups", icon: Settings },
];



export function SideDrawer({ showButton = true }: { showButton?: boolean }) {
    const [open, setOpen] = React.useState(false);

    // Close on Escape
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Prevent body scroll when open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Hamburger Button (Mobile Only) */}
            {showButton && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--bg-subtle)] active-scale text-[var(--text-secondary)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            )}

            {/* Backdrop (Mobile Only) */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={[
                    "fixed top-0 left-0 h-full w-72 lg:w-64 z-50 flex flex-col glass-panel lg:border-r lg:border-[var(--border-subtle)] lg:shadow-none",
                    "shadow-[var(--shadow-xl)] transition-transform duration-300",
                    open ? "translate-x-0 animate-drawer-in" : "-translate-x-full lg:translate-x-0",
                ].join(" ")}
                aria-modal="true"
                role="dialog"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                        <Link href="/" onClick={() => setOpen(false)} className="block focus-ring rounded-lg">
                            <img
                                src="/brand/logo-light.png"
                                alt="LekkerLedger"
                                className="h-10 w-auto transition-opacity hover:opacity-80"
                            />
                        </Link>
                        <p className="text-[9px] mt-0.5 opacity-40 font-medium" style={{ color: "var(--text-muted)" }}>
                            By Nightshift Labs
                        </p>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                        className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-subtle)] active-scale"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--text-muted)" }}>
                        Navigation
                    </p>
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
                            style={{ color: "var(--text-primary)" }}
                        >
                            <span
                                className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--amber-500)" }}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1">{label}</span>
                            <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
                        </Link>
                    ))}

                    <div className="pt-4 pb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 opacity-40" style={{ color: "var(--text-muted)" }}>
                            Legal & Compliance
                        </p>
                        <Link href="/legal/terms" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--amber-500)] font-medium transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/legal/privacy" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--amber-500)] font-medium transition-colors">
                            Privacy Policy (POPIA)
                        </Link>
                        <Link href="/legal/refunds" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--amber-500)] font-medium transition-colors">
                            Refund & Cancellation
                        </Link>
                    </div>
                </nav>

                {/* Support & Version Info */}
                <div
                    className="p-6 space-y-4"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                    <a
                        href="mailto:nightshiftlabsza@gmail.com?subject=LekkerLedger%20Support%20Request"
                        className="flex items-center gap-3 text-sm font-medium transition-colors hover:text-[var(--text-primary)]"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <div className="h-8 w-8 rounded-lg bg-[var(--amber-500)] flex items-center justify-center text-white">
                            <Mail className="h-4 w-4" />
                        </div>
                        Email Support
                    </a>

                    {/* Removed version numbers */}
                </div>



                {/* Footer */}
                <div className="px-5 pb-6 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold opacity-40" style={{ color: "var(--text-muted)" }}>
                        Crafted in South Africa 🇿🇦
                    </p>
                </div>
            </div>
        </>
    );
}
