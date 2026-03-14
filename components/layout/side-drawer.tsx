"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Mail, Menu, X } from "lucide-react";
import { APP_NAV_GROUPS } from "@/src/config/app-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";

// ─── Component ────────────────────────────────────────────────────────────────
interface SideDrawerProps {
    showButton?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    variant?: "default" | "dashboard";
    households?: Array<{ id: string; name: string }>;
    activeHouseholdId?: string;
    multiHouseholdEnabled?: boolean;
    onSwitchHousehold?: (id: string) => void;
    onAddHousehold?: () => void;
    employerName?: string;
    planLabel?: string;
}

export function SideDrawer({
    showButton = true,
    open: controlledOpen,
    onOpenChange,
    variant = "default",
    households = [],
    activeHouseholdId,
    multiHouseholdEnabled = false,
    onSwitchHousehold,
    onAddHousehold,
    employerName = "",
    planLabel = "",
}: SideDrawerProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const dashboardVariant = variant === "dashboard";

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
    }, [setOpen]);

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
                    className="lg:hidden h-9 sm:h-10 w-9 sm:w-10 flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 hover:bg-[var(--surface-2)] active-scale text-[var(--text-muted)]"
                >
                    <Menu className="h-4 sm:h-5 w-4 sm:w-5" />
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
            <dialog
                open
                aria-modal="true"
                aria-label="Navigation"
                className={[
                    "fixed top-0 left-0 h-full w-80 lg:w-64 min-[1600px]:lg:w-72 z-50 flex flex-col",
                    dashboardVariant ? "" : "glass-panel",
                    "lg:border-r lg:border-[var(--border)] lg:shadow-none",
                    "shadow-[var(--shadow-xl)] transition-transform duration-300",
                    "p-0 m-0 border-none max-w-none max-h-none", // Reset dialog defaults
                    open ? "translate-x-0 animate-drawer-in" : "-translate-x-full lg:translate-x-0",
                ].join(" ")}
                style={{
                    backgroundColor: dashboardVariant ? "var(--surface-sidebar)" : "var(--bg)",
                    backdropFilter: dashboardVariant ? "blur(18px)" : "blur(12px)",
                    WebkitBackdropFilter: dashboardVariant ? "blur(18px)" : "blur(12px)",
                    borderRight: "1px solid var(--border)",
                    display: "flex", // Ensure it's not hidden by default dialog styles
                }}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div
                    className="flex items-center justify-between px-3 sm:px-5 pt-3 sm:pt-5 pb-3 sm:pb-4 shrink-0 safe-area-pt"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div>
                        <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-lg py-1">
                            <Logo />
                        </Link>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                        className="lg:hidden h-7 sm:h-8 w-7 sm:w-8 flex items-center justify-center rounded-lg transition-all hover:bg-[var(--surface-2)] active-scale"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <X className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    </button>
                </div>

                {dashboardVariant && households.length > 0 && activeHouseholdId && onSwitchHousehold ? (
                    <div className="px-3 pb-3 pt-3 sm:px-4">
                        <HouseholdSwitcher
                            households={households}
                            activeId={activeHouseholdId}
                            isPro={multiHouseholdEnabled}
                            onSwitch={onSwitchHousehold}
                            onAddHousehold={onAddHousehold}
                            variant="account"
                        />
                    </div>
                ) : null}

                {/* ── Navigation ─────────────────────────────────────────── */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                    {APP_NAV_GROUPS.map((group) => (
                        <div key={group.label}>
                            <p
                                className="text-[10px] font-black uppercase tracking-[0.16em] px-3 mb-2"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {group.label}
                            </p>

                            <div className="space-y-0.5">
                                {group.links.map(({ href, label, sublabel, icon: Icon }) => {
                                    const active = isActive(href);
                                    const backgroundColor = active
                                        ? (dashboardVariant ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "var(--accent-subtle)")
                                        : "transparent";

                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${dashboardVariant ? "hover:bg-[var(--surface-raised)]/85" : ""}`}
                                            style={{
                                                color: active ? "var(--primary)" : "var(--text)",
                                                backgroundColor,
                                                fontWeight: active ? 700 : 500,
                                            }}
                                        >
                                            {/* Left active bar */}
                                            {active && (
                                                <span
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                                                    style={{ backgroundColor: "var(--primary)" }}
                                                />
                                            )}

                                            {/* Icon chip */}
                                            <span
                                                className="h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-200 shrink-0 shadow-[var(--shadow-sm)]"
                                                style={{
                                                    backgroundColor: active ? "var(--primary)" : dashboardVariant ? "var(--surface-raised)" : "var(--surface-raised)",
                                                    color: active ? "#ffffff" : "var(--primary)",
                                                }}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block leading-snug break-words">
                                                    {label}
                                                </span>
                                                {sublabel ? (
                                                    <span className="mt-0.5 block text-[10px] font-medium leading-4 text-[var(--text-muted)]">
                                                        {sublabel}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── Support ────────────────────────────────────────────── */}
                <div className="px-4 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                    <a
                        href="mailto:support@lekkerledger.co.za?subject=LekkerLedger%20Support%20Request"
                        className="flex items-center gap-3 text-sm font-medium rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-2)]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <div className="h-7 w-7 rounded-md bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                            <Mail className="h-3.5 w-3.5" />
                        </div>
                        Email Support
                    </a>
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div className="px-5 pb-5 pt-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                    {dashboardVariant ? (
                        <div className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Current workspace</p>
                            <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{employerName || "Household payroll"}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{planLabel || "Dashboard"}</p>
                        </div>
                    ) : null}
                </div>
            </dialog>
        </>
    );
}
