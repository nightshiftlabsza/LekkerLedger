"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   DataTable — responsive: <table> on ≥960px, stacked ListCard on mobile
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Column<T> {
    key: string;
    label: string;
    render: (item: T) => React.ReactNode;
    sortable?: boolean;
    align?: "left" | "right" | "center";
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: (item: T) => string;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    className?: string;
    /** Render function for mobile card layout (< 960px) */
    renderCard?: (item: T, index: number) => React.ReactNode;
}

type SortDir = "asc" | "desc";

function getAlignmentClass(align?: Column<unknown>["align"]) {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
}

export function DataTable<T>({
    columns, data, keyField, onRowClick, emptyMessage = "No data", className = "", renderCard,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = React.useState<string | null>(null);
    const [sortDir, setSortDir] = React.useState<SortDir>("asc");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    // Sorted data (basic string compare — consumers can provide pre-sorted data)
    const sorted = React.useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const col = columns.find(c => c.key === sortKey);
            if (!col) return 0;
            const aVal = String(col.render(a) ?? "");
            const bVal = String(col.render(b) ?? "");
            const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir, columns]);

    if (data.length === 0) {
        return (
            <p className="text-center type-body text-[var(--text-muted)] py-12">{emptyMessage}</p>
        );
    }

    return (
        <>
            {/* Desktop table (≥840px) */}
            <div className={`hidden min-840:block overflow-x-auto ${className}`}>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ${getAlignmentClass(col.align)} ${col.className ?? ""}`}
                                >
                                    {col.sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSort(col.key)}
                                            className={`inline-flex w-full items-center gap-1 border-0 bg-transparent p-0 select-none hover:text-[var(--text)] ${getAlignmentClass(col.align)}`}
                                        >
                                            <span>{col.label}</span>
                                            {sortKey === col.key && (
                                                sortDir === "asc"
                                                    ? <ChevronUp className="h-3 w-3" />
                                                    : <ChevronDown className="h-3 w-3" />
                                            )}
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center gap-1">{col.label}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {sorted.map((item) => (
                            <tr
                                key={keyField(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-[var(--surface-2)]" : ""}`}
                            >
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3.5 text-[var(--text)] ${getAlignmentClass(col.align)} ${col.className ?? ""}`}
                                    >
                                        {col.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards (<840px) */}
            <div className={`min-840:hidden space-y-2 ${className}`}>
                {sorted.map((item, i) => (
                    <React.Fragment key={keyField(item)}>
                        {renderCard ? renderCard(item, i) : (
                            onRowClick ? (
                                <button
                                    type="button"
                                    className="glass-panel w-full rounded-xl border-0 p-4 space-y-2 bg-transparent text-left cursor-pointer hover-lift"
                                    onClick={() => onRowClick(item)}
                                >
                                    {columns.map(col => (
                                        <div key={col.key} className="flex items-start justify-between gap-4 py-1 border-b border-[var(--border)]/30 last:border-0">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] pt-1 shrink-0">{col.label}</span>
                                            <div className="text-sm font-semibold text-[var(--text)] text-right flex flex-col items-end max-w-[65%]">
                                                {col.render(item)}
                                            </div>
                                        </div>
                                    ))}
                                </button>
                            ) : (
                                <div className="glass-panel rounded-xl p-4 space-y-2">
                                    {columns.map(col => (
                                        <div key={col.key} className="flex items-start justify-between gap-4 py-1 border-b border-[var(--border)]/30 last:border-0">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] pt-1 shrink-0">{col.label}</span>
                                            <div className="text-sm font-semibold text-[var(--text)] text-right flex flex-col items-end max-w-[65%]">
                                                {col.render(item)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </React.Fragment>
                ))}
            </div>
        </>
    );
}
