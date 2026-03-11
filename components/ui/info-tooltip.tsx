"use client";

import * as React from "react";

export function InfoTooltip({ label, tooltip }: { label: string; tooltip: string }) {
    const [open, setOpen] = React.useState(false);
    const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <span
            className="relative inline-flex"
            ref={ref}
            onMouseEnter={() => {
                hoverTimer.current = setTimeout(() => setOpen(true), 150);
            }}
            onMouseLeave={() => {
                if (hoverTimer.current) {
                    clearTimeout(hoverTimer.current);
                    hoverTimer.current = null;
                }
                setOpen(false);
            }}
        >
            <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-1"
                style={{ color: "var(--primary)", border: "1px solid var(--primary)" }}
                aria-label={label}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                i
            </button>
            {open && (
                <span
                    role="tooltip"
                    className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-xs leading-relaxed text-[var(--text)] shadow-lg"
                    style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                >
                    {tooltip}
                </span>
            )}
        </span>
    );
}
