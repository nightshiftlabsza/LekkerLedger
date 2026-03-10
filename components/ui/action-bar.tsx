"use client";

import * as React from "react";

interface ActionBarProps {
    primaryAction?: React.ReactNode;
    secondaryAction?: React.ReactNode;
    /** Optional hint text below actions (e.g. Drive backup status) */
    hint?: React.ReactNode;
    /** "paper" = Civic Ledger paper panel; "glass" = glassmorphism (default) */
    variant?: "glass" | "paper";
    className?: string;
}

/**
 * ActionBar: sticky bottom bar on mobile, inline on desktop.
 * Primary + secondary button slots.
 * Use variant="paper" for Civic Ledger workflow pages (no glassmorphism).
 */
export function ActionBar({ primaryAction, secondaryAction, hint, variant = "glass", className = "" }: ActionBarProps) {
    if (!primaryAction && !secondaryAction && !hint) return null;

    const isPaper = variant === "paper";
    const barStyles = isPaper
        ? "bg-[var(--surface-1)] border-t border-[var(--border)] shadow-[0_-2px_8px_rgba(0,0,0,0.04)] lg:shadow-none lg:bg-transparent lg:border-0"
        : "glass-panel border-t border-[var(--border)] lg:border-0 lg:bg-transparent lg:backdrop-blur-none";

    return (
        <div
            className={`
                fixed bottom-16 left-0 right-0 z-30 lg:static lg:bottom-auto
                ${barStyles}
                px-4 py-3 lg:px-0 lg:py-0
                ${className}
            `}
        >
            <div className="max-w-4xl mx-auto space-y-2">
                <div className="flex items-center gap-3 lg:justify-end">
                    {secondaryAction}
                    {primaryAction}
                </div>
                {hint && (
                    <p className="text-[11px] text-[var(--text-muted)] text-center lg:text-right max-w-md lg:ml-auto">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
}
