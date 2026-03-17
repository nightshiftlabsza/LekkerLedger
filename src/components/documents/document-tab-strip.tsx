"use client";

import * as React from "react";

export interface DocumentTabStripItem<TTab extends string> {
    readonly id: TTab;
    readonly label: string;
    readonly count?: number;
}

interface DocumentTabStripProps<TTab extends string> {
    readonly ariaLabel: string;
    readonly activeTab: TTab;
    readonly tabs: ReadonlyArray<DocumentTabStripItem<TTab>>;
    readonly onChange: (tab: TTab) => void;
    readonly fullBleedMobile?: boolean;
    readonly showSummaryCounts?: boolean;
    readonly className?: string;
}

export function DocumentTabStrip<TTab extends string>({
    ariaLabel,
    activeTab,
    tabs,
    onChange,
    fullBleedMobile = false,
    showSummaryCounts = false,
    className = "",
}: DocumentTabStripProps<TTab>) {
    return (
        <div className={`space-y-3 ${className}`.trim()}>
            {showSummaryCounts ? (
                <div className="hidden flex-wrap gap-2 sm:flex">
                    {tabs.map((tab) => (
                        <div
                            key={`${tab.id}-count`}
                            className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] shadow-sm"
                        >
                            <span className="mr-1 font-black text-[var(--text)]">{tab.count ?? 0}</span>
                            {tab.label}
                        </div>
                    ))}
                </div>
            ) : null}

            <div className={fullBleedMobile ? "-mx-4 px-4 lg:mx-0 lg:px-0" : ""}>
                <div
                    role="tablist"
                    aria-label={ariaLabel}
                    className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto no-scrollbar"
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onChange(tab.id)}
                                className={`min-h-[44px] whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${isActive
                                    ? "border-[var(--primary)] text-[var(--primary)]"
                                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
