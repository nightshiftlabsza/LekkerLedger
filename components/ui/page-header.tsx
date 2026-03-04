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
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 ${className}`}>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="type-h2 text-[var(--text-primary)] truncate">{title}</h1>
                    {householdChip}
                    {syncBadge}
                </div>
                {subtitle && (
                    <p className="type-label text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
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
