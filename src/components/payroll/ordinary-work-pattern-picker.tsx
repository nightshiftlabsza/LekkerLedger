"use client";

import * as React from "react";
import {
    buildEmptyOrdinaryWorkPattern,
    type OrdinaryWorkPattern,
    ORDINARY_WORK_PATTERN_KEYS,
    ORDINARY_WORK_PATTERN_LABELS,
} from "@/lib/ordinary-work-pattern";

interface OrdinaryWorkPatternPickerProps {
    value?: OrdinaryWorkPattern | null;
    onChange: (nextValue: OrdinaryWorkPattern) => void;
    disabled?: boolean;
    error?: string;
    helperText?: string;
}

export function OrdinaryWorkPatternPicker({
    value,
    onChange,
    disabled,
    error,
    helperText,
}: OrdinaryWorkPatternPickerProps) {
    const pattern = value ?? buildEmptyOrdinaryWorkPattern();

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {ORDINARY_WORK_PATTERN_KEYS.map((dayKey) => {
                    const selected = pattern[dayKey];
                    return (
                        <button
                            key={dayKey}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange({ ...pattern, [dayKey]: !selected })}
                            className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${
                                selected
                                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                    : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"
                            } ${disabled ? "opacity-60" : ""}`}
                        >
                            {ORDINARY_WORK_PATTERN_LABELS[dayKey]}
                        </button>
                    );
                })}
            </div>
            {helperText ? <p className="text-sm leading-6 text-[var(--text-muted)]">{helperText}</p> : null}
            {error ? <p className="text-sm font-medium text-[var(--danger)]">{error}</p> : null}
        </div>
    );
}
