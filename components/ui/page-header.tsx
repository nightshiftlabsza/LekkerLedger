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
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${className}`}>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="type-h2 text-[var(--text)]">{title}</h1>
                    <div className="flex items-center gap-2">
                        {householdChip}
                        {syncBadge}
                    </div>
                </div>
                {subtitle && (
                    <p className="type-label text-[var(--text-muted)] max-w-[60ch]">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 shrink-0 sm:self-start md:self-center">
                    {actions}
                </div>
            )}
        </div>
    );
}
