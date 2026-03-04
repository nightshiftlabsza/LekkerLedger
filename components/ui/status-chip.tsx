"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, XCircle, FileEdit, Lock, Loader2, Circle, Clock } from "lucide-react";

export type ChipVariant = "complete" | "needs-info" | "blocked" | "draft" | "locked" | "in-progress" | "empty" | "partial";

const VARIANTS: Record<ChipVariant, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    complete: { bg: "rgba(16,185,129,0.10)", text: "var(--color-success)", icon: CheckCircle2, label: "Complete" },
    "needs-info": { bg: "rgba(217,119,6,0.10)", text: "var(--amber-500)", icon: AlertCircle, label: "Needs info" },
    blocked: { bg: "rgba(220,38,38,0.10)", text: "var(--red-500)", icon: XCircle, label: "Blocked" },
    draft: { bg: "rgba(115,115,115,0.10)", text: "var(--text-secondary)", icon: FileEdit, label: "Draft" },
    locked: { bg: "rgba(37,99,235,0.10)", text: "var(--blue-500)", icon: Lock, label: "Locked" },
    "in-progress": { bg: "rgba(217,119,6,0.10)", text: "var(--amber-500)", icon: Loader2, label: "In progress" },
    empty: { bg: "rgba(115,115,115,0.08)", text: "var(--text-muted)", icon: Circle, label: "Not started" },
    partial: { bg: "rgba(217,119,6,0.10)", text: "var(--amber-500)", icon: Clock, label: "Partial" },
};

interface StatusChipProps {
    variant: ChipVariant;
    label?: string;
    className?: string;
}

export function StatusChip({ variant, label, className = "" }: StatusChipProps) {
    const v = VARIANTS[variant] || VARIANTS["draft"];
    if (!v) return null;
    const Icon = v.icon || Circle;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${className}`}
            style={{ backgroundColor: v.bg, color: v.text }}
        >
            <Icon className={`h-3 w-3 shrink-0 ${variant === "in-progress" ? "animate-spin" : ""}`} />
            {label ?? v.label}
        </span>
    );
}

