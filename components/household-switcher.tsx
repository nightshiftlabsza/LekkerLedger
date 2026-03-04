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
}

export function HouseholdSwitcher({
    households, activeId, isPro, onSwitch, onAddHousehold, className = "",
}: HouseholdSwitcherProps) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    const active = households.find(h => h.id === activeId);

    // Close on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close on Escape
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: "var(--text-muted)" }}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <Home className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span className="truncate max-w-[120px]">{active?.name ?? "Household"}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 w-56 glass-panel rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border)] py-1 z-50 animate-slide-down"
                    role="listbox"
                >
                    {households.map(h => (
                        <button
                            key={h.id}
                            role="option"
                            aria-selected={h.id === activeId}
                            onClick={() => { onSwitch(h.id); setOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: h.id === activeId ? "var(--primary)" : "var(--text)" }}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Home className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{h.name}</span>
                            </div>
                            {h.id === activeId && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                    ))}

                    {/* Add household */}
                    <div className="border-t border-[var(--border)] mt-1 pt-1">
                        <button
                            onClick={() => { setOpen(false); onAddHousehold?.(); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
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
