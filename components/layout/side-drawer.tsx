"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    X, FileText, Users, Menu, LayoutDashboard,
    Palmtree, FileSpreadsheet, Settings,
    BookOpen, Sparkles, Mail, Calculator,
    ClipboardList, FolderOpen, Banknote,
} from "lucide-react";

// ─── Nav groups — matches IA Blueprint v1 ──────────────────────────────────
const NAV_GROUPS = [
    {
        label: "Work",
        links: [
            { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/app/payroll", label: "Monthly Payroll", icon: Banknote },
            { href: "/app/employees", label: "Employees", icon: Users },
            { href: "/app/leave", label: "Leave", icon: Palmtree },
            { href: "/app/contracts", label: "Contracts", icon: FileText },
        ],
    },
    {
        label: "Documents",
        links: [
            { href: "/app/documents", label: "Documents", icon: FolderOpen },
        ],
    },
    {
        label: "Tools",
        links: [
            { href: "/app/ufiling", label: "uFiling Export", icon: FileSpreadsheet },
            { href: "/app/tools/wage-calculator", label: "Wage Calculator", icon: Calculator },
            { href: "/app/help/compliance", label: "Compliance Guide", icon: BookOpen },
        ],
    },
    {
        label: "Account",
        links: [
            { href: "/app/settings", label: "Settings", icon: Settings },
            { href: "/pricing", label: "Support & Pro", icon: Sparkles },
        ],
    },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function SideDrawer({ showButton = true }: { showButton?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();

    /** True when this nav link should appear active */
    const isActive = (href: string) => {
        const hrefPath = href.split("?")[0];
        if (hrefPath === "/") return pathname === "/";
        return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    };

    // Close on Escape
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Prevent body scroll when open on mobile
    React.useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Hamburger (mobile only) */}
            {showButton && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--bg-subtle)] active-scale text-[var(--text-secondary)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            )}

            {/* Backdrop (mobile only) */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className={[
                    "fixed top-0 left-0 h-full w-72 lg:w-64 z-50 flex flex-col glass-panel",
                    "lg:border-r lg:border-[var(--border-subtle)] lg:shadow-none",
                    "shadow-[var(--shadow-xl)] transition-transform duration-300",
                    open ? "translate-x-0 animate-drawer-in" : "-translate-x-full lg:translate-x-0",
                ].join(" ")}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div
                    className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                    <div>
                        <Link href="/app/dashboard" onClick={() => setOpen(false)} className="block rounded-lg">
                            <Image
                                src="/brand/logo-light.png"
                                alt="LekkerLedger"
                                width={120}
                                height={30}
                                className="h-10 w-auto transition-opacity hover:opacity-80 block dark:hidden"
                                priority
                            />
                            <Image
                                src="/brand/logo-dark.png"
                                alt="LekkerLedger"
                                width={120}
                                height={30}
                                className="h-10 w-auto transition-opacity hover:opacity-80 hidden dark:block"
                                priority
                            />
                        </Link>
                        <p className="text-[9px] mt-0.5 font-medium opacity-40" style={{ color: "var(--text-muted)" }}>
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

                {/* ── Navigation ─────────────────────────────────────────── */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label}>
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {group.label}
                            </p>

                            <div className="space-y-0.5">
                                {group.links.map(({ href, label, icon: Icon }) => {
                                    const active = isActive(href);
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
                                            style={{
                                                color: active ? "var(--amber-500)" : "var(--text-primary)",
                                                backgroundColor: active ? "rgba(217,119,6,0.09)" : "transparent",
                                                fontWeight: active ? 700 : 500,
                                            }}
                                        >
                                            {/* Left active bar */}
                                            {active && (
                                                <span
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                                                    style={{ backgroundColor: "var(--amber-500)" }}
                                                />
                                            )}

                                            {/* Icon chip */}
                                            <span
                                                className="h-7 w-7 flex items-center justify-center rounded-md transition-colors shrink-0"
                                                style={{
                                                    backgroundColor: active ? "var(--amber-500)" : "var(--bg-subtle)",
                                                    color: active ? "#ffffff" : "var(--amber-500)",
                                                }}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                            </span>

                                            <span className="flex-1 truncate">{label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── Support ────────────────────────────────────────────── */}
                <div className="px-4 py-4 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <a
                        href="mailto:nightshiftlabsza@gmail.com?subject=LekkerLedger%20Support%20Request"
                        className="flex items-center gap-3 text-sm font-medium rounded-lg px-2 py-2 transition-colors hover:bg-[var(--bg-subtle)]"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <div className="h-7 w-7 rounded-md bg-[var(--amber-500)] flex items-center justify-center text-white shrink-0">
                            <Mail className="h-3.5 w-3.5" />
                        </div>
                        Email Support
                    </a>
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div className="px-5 pb-5 pt-3 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold opacity-40" style={{ color: "var(--text-muted)" }}>
                        Crafted in South Africa 🇿🇦
                    </p>
                </div>
            </div>
        </>
    );
}
