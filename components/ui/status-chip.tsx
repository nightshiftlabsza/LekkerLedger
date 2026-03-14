"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, XCircle, FileEdit, Lock, Loader2, Circle, Clock } from "lucide-react";

export type ChipVariant = "complete" | "needs-info" | "blocked" | "draft" | "locked" | "in-progress" | "empty" | "partial";

const VARIANTS: Record<ChipVariant, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    complete: { bg: "rgba(6,118,71,0.10)", text: "var(--success)", icon: CheckCircle2, label: "Complete" },
    "needs-info": { bg: "rgba(196,122,28,0.10)", text: "var(--focus)", icon: AlertCircle, label: "Needs info" },
    blocked: { bg: "rgba(180,35,24,0.10)", text: "var(--danger)", icon: XCircle, label: "Blocked" },
    draft: { bg: "rgba(71,84,103,0.10)", text: "var(--text-muted)", icon: FileEdit, label: "In progress" },
    locked: { bg: "rgba(71,84,103,0.10)", text: "var(--text-muted)", icon: Lock, label: "Finalised" },
    "in-progress": { bg: "rgba(196,122,28,0.10)", text: "var(--focus)", icon: Loader2, label: "In progress" },
    empty: { bg: "rgba(71,84,103,0.08)", text: "var(--text-muted)", icon: Circle, label: "Not started" },
    partial: { bg: "rgba(196,122,28,0.10)", text: "var(--focus)", icon: Clock, label: "Started" },
};

interface StatusChipProps {
    readonly variant: ChipVariant;
    readonly label?: string;
    readonly className?: string;
}

export function StatusChip({ variant, label, className = "" }: StatusChipProps) {
    const v = VARIANTS[variant] || VARIANTS["draft"];
    if (!v) return null;
    const Icon = v.icon || Circle;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active-scale select-none ${className}`}
            style={{ 
                backgroundColor: v.bg, 
                color: v.text,
                border: `1px solid ${v.text.replace(')', ', 0.2)')}` // Dynamic soft border
            }}
        >
            <Icon className={`h-3 w-3 shrink-0 ${variant === "in-progress" ? "animate-spin" : ""}`} />
            {label ?? v.label}
        </span>
    );
}
