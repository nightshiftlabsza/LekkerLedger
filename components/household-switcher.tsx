"use client";

import * as React from "react";
import { Home, Sparkles, ChevronDown, Plus, Check } from "lucide-react";

interface Household {
    id: string;
    name: string;
}

interface HouseholdSwitcherProps {
    households: Household[];
    activeId: string;
    isPro: boolean;
    onSwitch: (id: string) => void;
    onAddHousehold?: () => void;
    className?: string;
    variant?: "default" | "account";
}

export function HouseholdSwitcher({
    households, activeId, isPro, onSwitch, onAddHousehold, className = "", variant = "default",
}: HouseholdSwitcherProps) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    const active = households.find(h => h.id === activeId);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={[
                    "transition-colors",
                    variant === "account"
                        ? "flex w-full max-w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(16,24,40,0.04)] hover:border-[var(--primary)]/25 sm:min-w-[220px]"
                        : "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-[var(--surface-2)]",
                ].join(" ")}
                style={{ color: variant === "account" ? "var(--text)" : "var(--text-muted)" }}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                {variant === "account" ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                                <Home className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Household</p>
                                <p className="truncate text-sm font-semibold text-[var(--text)]">{active?.name ?? "Household"}</p>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
                    </>
                ) : (
                    <>
                        <Home className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span className="max-w-[120px] truncate">{active?.name ?? "Household"}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                    </>
                )}
            </button>

            {open && (
                <div
                    className={[
                        "absolute top-full mt-1 glass-panel border border-[var(--border)] py-1 shadow-[var(--shadow-lg)] z-50 animate-slide-down",
                        variant === "account" ? "right-0 w-72 rounded-2xl" : "left-0 w-56 rounded-xl",
                    ].join(" ")}
                    role="listbox"
                >
                    {households.map(h => (
                        <button
                            key={h.id}
                            role="option"
                            aria-selected={h.id === activeId}
                            onClick={() => { onSwitch(h.id); setOpen(false); }}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: h.id === activeId ? "var(--primary)" : "var(--text)" }}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Home className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{h.name}</span>
                            </div>
                            {h.id === activeId && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                    ))}

                    <div className="mt-1 border-t border-[var(--border)] pt-1">
                        <button
                            onClick={() => { setOpen(false); onAddHousehold?.(); }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: isPro ? "var(--primary)" : "var(--text-muted)" }}
                        >
                            {isPro ? (
                                <Plus className="h-3.5 w-3.5" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {isPro ? "Add household" : "Add household (Pro)"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
