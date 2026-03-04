"use client";

import * as React from "react";

interface ActionBarProps {
    primaryAction?: React.ReactNode;
    secondaryAction?: React.ReactNode;
    className?: string;
}

/**
 * ActionBar: sticky bottom bar on mobile, inline on desktop.
 * Primary + secondary button slots.
 */
export function ActionBar({ primaryAction, secondaryAction, className = "" }: ActionBarProps) {
    if (!primaryAction && !secondaryAction) return null;

    return (
        <div
            className={`
                fixed bottom-16 left-0 right-0 z-30 lg:static lg:bottom-auto
                glass-panel border-t border-[var(--border-subtle)] lg:border-0 lg:bg-transparent lg:backdrop-blur-none
                px-4 py-3 lg:px-0 lg:py-0
                ${className}
            `}
        >
            <div className="max-w-4xl mx-auto flex items-center gap-3 lg:justify-end">
                {secondaryAction}
                {primaryAction}
            </div>
        </div>
    );
}
