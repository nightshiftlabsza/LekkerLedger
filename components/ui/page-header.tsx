"use client";

import * as React from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    householdChip?: React.ReactNode;
    syncBadge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, subtitle, householdChip, syncBadge, actions, className = "" }: PageHeaderProps) {
    return (
        <div className={`flex flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8 ${className}`}>
            <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] leading-tight">{title}</h1>
                    <div className="flex items-center gap-2">
                        {householdChip}
                        {syncBadge}
                    </div>
                </div>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-[60ch] leading-snug">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
