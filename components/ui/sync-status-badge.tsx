"use client";

import * as React from "react";
import { Cloud, CloudOff, Loader2, AlertTriangle, Check } from "lucide-react";

export type SyncState = "synced" | "syncing" | "error" | "offline" | "disconnected";

interface SyncStatusBadgeProps {
    state: SyncState;
    lastSync?: string;  // e.g. "14:32"
    className?: string;
}

const STATES: Record<SyncState, { icon: React.ElementType; label: string; color: string }> = {
    synced: { icon: Check, label: "Synced", color: "var(--success)" },
    syncing: { icon: Loader2, label: "Syncing", color: "var(--primary)" },
    error: { icon: AlertTriangle, label: "Sync error", color: "var(--danger)" },
    offline: { icon: CloudOff, label: "Offline", color: "var(--text-muted)" },
    disconnected: { icon: Cloud, label: "Not connected", color: "var(--text-muted)" },
};

export function SyncStatusBadge({ state, lastSync, className = "" }: SyncStatusBadgeProps) {
    const s = STATES[state];
    const Icon = s.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${className}`}
            style={{
                color: s.color,
                borderColor: `color-mix(in srgb, ${s.color} 25%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${s.color} 8%, transparent)`,
            }}
        >
            <Icon className={`h-3 w-3 ${state === "syncing" ? "animate-spin" : ""}`} />
            {s.label}
            {lastSync && state === "synced" && (
                <span className="text-[var(--text-muted)]">{lastSync}</span>
            )}
        </span>
    );
}
