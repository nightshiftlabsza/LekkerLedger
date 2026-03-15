"use client";

import * as React from "react";

interface ActionBarProps {
    readonly primaryAction?: React.ReactNode;
    readonly secondaryAction?: React.ReactNode;
    /** Optional hint text below actions (e.g. Drive backup status) */
    readonly hint?: React.ReactNode;
    /** "paper" = Civic Ledger paper panel; "glass" = glassmorphism (default) */
    readonly variant?: "glass" | "paper";
    readonly className?: string;
}

/**
 * ActionBar: sticky bottom bar on mobile, inline from tablet upward.
 * Primary + secondary button slots.
 * Use variant="paper" for Civic Ledger workflow pages (no glassmorphism).
 */
export function ActionBar({ primaryAction, secondaryAction, hint, variant = "glass", className = "" }: ActionBarProps) {
    if (!primaryAction && !secondaryAction && !hint) return null;

    const isPaper = variant === "paper";
    const barStyles = isPaper
        ? "bg-[var(--surface-1)] border-t border-[var(--border)] shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:shadow-none md:bg-transparent md:border-0"
        : "glass-panel border-t border-[var(--border)] md:border-0 md:bg-transparent md:backdrop-blur-none";

    return (
        <div
            className={`
                fixed left-0 right-0 z-30 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:static md:bottom-auto
                ${barStyles}
                px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-0 md:py-0 md:pb-0
                ${className}
            `}
        >
            <div className="max-w-4xl mx-auto space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                    {secondaryAction}
                    {primaryAction}
                </div>
                {hint && (
                    <p className="max-w-md text-center text-[11px] text-[var(--text-muted)] md:ml-auto md:text-right">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
}
