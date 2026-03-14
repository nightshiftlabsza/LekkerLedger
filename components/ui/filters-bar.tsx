"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   FiltersBar — Search + filter chips + sort dropdown
   ═══════════════════════════════════════════════════════════════════════════ */

export interface FilterChip {
    readonly key: string;
    readonly label: string;
    readonly active: boolean;
}

export interface SortOption {
    readonly key: string;
    readonly label: string;
}

interface FiltersBarProps {
    readonly searchValue: string;
    readonly onSearchChange: (value: string) => void;
    readonly searchPlaceholder?: string;
    readonly filters?: readonly FilterChip[];
    readonly onFilterToggle?: (key: string) => void;
    readonly sortOptions?: readonly SortOption[];
    readonly activeSort?: string;
    readonly onSortChange?: (key: string) => void;
    readonly className?: string;
}

export function FiltersBar({
    searchValue, onSearchChange, searchPlaceholder = "Search...",
    filters, onFilterToggle,
    sortOptions, activeSort, onSortChange,
    className = "",
}: FiltersBarProps) {
    const [sortOpen, setSortOpen] = React.useState(false);
    const sortRef = React.useRef<HTMLDivElement>(null);

    // Close sort dropdown on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Search row */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[16px] sm:text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    {searchValue && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Sort dropdown */}
                {sortOptions && sortOptions.length > 0 && (
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setSortOpen(!sortOpen)}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Sort
                            <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                        </button>
                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-1 w-40 glass-panel rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border)] py-1 z-40">
                                {sortOptions.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => { onSortChange?.(opt.key); setSortOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--surface-2)] ${activeSort === opt.key
                                                ? "text-[var(--primary)] font-bold"
                                                : "text-[var(--text)]"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Filter chips */}
            {filters && filters.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {filters.map(chip => (
                        <button
                            key={chip.key}
                            onClick={() => onFilterToggle?.(chip.key)}
                            className={`shrink-0 px-3 py-1.5 min-h-[36px] rounded-full text-[11px] font-bold uppercase tracking-wide border transition-colors ${chip.active
                                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                    : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
