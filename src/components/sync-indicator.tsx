"use client";

import * as React from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useAppMode } from "@/lib/app-mode";
import { useRealtimeSync } from "../hooks/use-realtime-sync";
import { syncService } from "@/lib/sync-service";

export function SyncIndicator() {
    const { mode } = useAppMode();
    const syncSnapshot = React.useSyncExternalStore(
        (listener) => syncService.subscribe(() => listener()),
        () => syncService.getSnapshot(),
        () => syncService.getSnapshot(),
    );
    const [recentActivityAt, setRecentActivityAt] = React.useState<number | null>(null);

    const handleRealtimeUpdate = React.useEffectEvent(() => {
        setRecentActivityAt(Date.now());
    });

    React.useEffect(() => {
        if (!recentActivityAt) return;

        const timeoutHandle = window.setTimeout(() => {
            setRecentActivityAt((current) => (current === recentActivityAt ? null : current));
        }, 1000);

        return () => {
            window.clearTimeout(timeoutHandle);
        };
    }, [recentActivityAt]);

    useRealtimeSync(mode === "account_unlocked" ? syncSnapshot.userId ?? undefined : undefined, handleRealtimeUpdate);

    const isOffline = mode === "local_guest" || mode === "account_locked";
    const isSyncing = !isOffline && (syncSnapshot.syncing || recentActivityAt !== null);
    const hasError = !isOffline && syncSnapshot.hasError;

    if (isOffline) {
        return (
            <div className="flex items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] border border-[var(--border-subtle)]" title="Data stored locally">
                <CloudOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Local Only</span>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex items-center gap-2 rounded-full border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-1.5 text-xs font-medium text-[var(--danger)]" title={syncSnapshot.lastError || "Sync needs attention"}>
                <CloudOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sync issue</span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--primary)] shadow-[0_0_0_2px_var(--primary-transparent)]" title="Syncing with cloud">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-full border border-transparent bg-[var(--secondary-alpha)] px-3 py-1.5 text-xs font-medium text-[var(--primary)]" title="Synced with cloud">
            <Cloud className="h-3.5 w-3.5 text-[#007A4D]" />
            <span className="hidden sm:inline text-[#007A4D]">All Synced ✓</span>
        </div>
    );
}
