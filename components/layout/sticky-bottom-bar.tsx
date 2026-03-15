"use client";

import * as React from "react";

interface StickyBottomBarProps {
    readonly children: React.ReactNode;
    readonly className?: string;
}

/**
 * A fixed bottom bar for wizard navigation and form actions.
 * Stays pinned to the viewport bottom on mobile so Next/Back buttons
 * are always thumb-reachable without scrolling.
 */
export function StickyBottomBar({ children, className = "" }: StickyBottomBarProps) {
    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-20 lg:left-64 glass-panel ${className}`}
            style={{
                borderTop: "1px solid var(--border)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
                {children}
            </div>
        </div>
    );
}
