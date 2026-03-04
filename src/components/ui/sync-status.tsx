"use client";

import * as React from "react";
import { CloudOff, Cloud, RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { useOnlineStatus } from "@/src/app/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";

export interface SyncStatusModuleProps {
    lastSyncTimestamp?: Date | null;
    isSyncing?: boolean;
    syncError?: string | null;
    onManualSync?: () => void;
    compact?: boolean;
}

export function SyncStatusModule({
    lastSyncTimestamp,
    isSyncing = false,
    syncError,
    onManualSync,
    compact = false,
}: SyncStatusModuleProps) {
    const isOnline = useOnlineStatus();

    // Determine State
    let state: "offline" | "syncing" | "error" | "synced" = "synced";
    if (!isOnline) state = "offline";
    else if (isSyncing) state = "syncing";
    else if (syncError) state = "error";

    const stateConfig = {
        offline: {
            icon: CloudOff,
            color: "var(--primary)",
            bg: "rgba(217,119,6,0.1)",
            text: "Offline",
            desc: "Changes saved locally. Will sync when reconnected.",
        },
        syncing: {
            icon: RefreshCcw,
            color: "var(--blue-500)",
            bg: "rgba(59,130,246,0.1)",
            text: "Syncing...",
            desc: "Uploading local changes to the cloud.",
            spin: true,
        },
        error: {
            icon: AlertCircle,
            color: "var(--rose-500)",
            bg: "rgba(244,63,94,0.1)",
            text: "Sync Error",
            desc: syncError || "Failed to sync. Tap to retry.",
        },
        synced: {
            icon: Cloud,
            color: "var(--emerald-500)",
            bg: "rgba(16,185,129,0.1)",
            text: "Synced",
            desc: lastSyncTimestamp
                ? `Last synced: ${lastSyncTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "All changes are backed up.",
        }
    };

    const config = stateConfig[state] as { icon: React.ElementType; color: string; bg: string; text: string; desc: string; spin?: boolean };
    const Icon = config.icon;

    if (compact) {
        return (
            <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors"
                style={{
                    backgroundColor: config.bg,
                    color: config.color,
                    borderColor: `${config.color}30` // 30 hex opacity
                }}
            >
                <Icon className={`h-3 w-3 ${config.spin ? "animate-spin" : ""}`} />
                {config.text}
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
                <div
                    className="h-10 w-10 flex items-center justify-center rounded-xl shrink-0 transition-colors"
                    style={{ backgroundColor: config.bg, color: config.color }}
                >
                    {state === "synced" ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <Icon className={`h-5 w-5 ${config.spin ? "animate-spin" : ""}`} />
                    )}
                </div>
                <div>
                    <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {config.text}
                    </h4>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                        {config.desc}
                    </p>
                </div>
            </div>

            {onManualSync && state !== "syncing" && state !== "offline" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onManualSync}
                    className="shrink-0 h-8 px-3 text-xs font-semibold hover:bg-[var(--bg-subtle)] active:scale-95 transition-all"
                >
                    Sync Now
                </Button>
            )}

            {onManualSync && state === "error" && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onManualSync}
                    className="shrink-0 h-8 px-3 text-xs font-semibold border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all"
                >
                    Retry
                </Button>
            )}
        </div>
    );
}
