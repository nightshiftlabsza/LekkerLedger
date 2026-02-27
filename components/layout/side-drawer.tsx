"use client";

import * as React from "react";
import Link from "next/link";
import {
    X,
    Sun,
    Moon,
    Monitor,
    FileText,
    Users,
    Home,
    ChevronRight,
    Menu,
    LayoutDashboard,
    Palmtree,
    FileSpreadsheet,
    Settings,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const NAV_LINKS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/leave", label: "Leave Tracker", icon: Palmtree, note: "Select an employee first" },
    { href: "/contracts", label: "Contracts", icon: FileText },
    { href: "/ufiling", label: "uFiling Export", icon: FileSpreadsheet },
    { href: "/settings", label: "Settings", icon: Settings },
];

const THEME_OPTIONS = [
    { value: "system" as const, label: "Auto", icon: Monitor },
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
];

export function SideDrawer() {
    const [open, setOpen] = React.useState(false);
    const { theme, setTheme } = useTheme();

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
            {/* Hamburger Button */}
            <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--bg-subtle)] active:scale-95 text-[var(--text-secondary)]"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={[
                    "fixed top-0 left-0 h-full w-72 z-50 flex flex-col",
                    "shadow-[var(--shadow-xl)] transition-transform duration-300",
                    open ? "translate-x-0 animate-drawer-in" : "-translate-x-full",
                ].join(" ")}
                style={{ backgroundColor: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}
                aria-modal="true"
                role="dialog"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--amber-500)" }}>
                            LekkerLedger
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            By Nightshift Labs ZA
                        </p>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                        className="h-8 w-8 flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-subtle)] active:scale-95"
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
                </nav>

                {/* Theme Switcher */}
                <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                        Appearance
                    </p>
                    <div
                        className="flex items-center rounded-lg p-1 gap-1"
                        style={{ backgroundColor: "var(--bg-subtle)" }}
                    >
                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                            const active = theme === value;
                            return (
                                <button
                                    key={value}
                                    onClick={() => setTheme(value)}
                                    className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 active:scale-95"
                                    style={{
                                        backgroundColor: active ? "var(--bg-surface)" : "transparent",
                                        color: active ? "var(--amber-500)" : "var(--text-muted)",
                                        boxShadow: active ? "var(--shadow-sm)" : "none",
                                    }}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-6 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-2">
                        <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black"
                            style={{ backgroundColor: "var(--amber-500)", color: "var(--text-inverse)" }}
                        >
                            N
                        </div>
                        <div>
                            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                Nightshift Labs ZA
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                Crafted in South Africa 🇿🇦
                            </p>
                        </div>
                    </div>
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                        Beta v0.2 · Data saved on your device only. No accounts, no servers.
                    </p>
                </div>
            </div>
        </>
    );
}
