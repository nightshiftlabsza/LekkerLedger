"use client";

import React, { useEffect, useState } from 'react';
import { syncService } from '@/lib/sync-service';
import { useRealtimeSync } from '../hooks/use-realtime-sync';
import { useAppMode } from '@/lib/app-mode';
import { createClient } from '@/lib/supabase/client';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export function SyncIndicator() {
    const { mode } = useAppMode();
    const [status, setStatus] = useState<"offline" | "syncing" | "synced">("offline");
    const [userId, setUserId] = useState<string | undefined>();
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (mounted && user) {
                setUserId(user.id);
            }
        }
        checkAuth();
        return () => { mounted = false; };
    }, [supabase]);

    // Activate Realtime Listener if unlocked
    useRealtimeSync(mode === 'account_unlocked' ? userId : undefined, () => {
         // Data changed locally or remotely, trigger visual 
         setStatus("syncing");
         setTimeout(() => setStatus("synced"), 1000);
    });

    useEffect(() => {
        if (mode === 'local_guest' || mode === 'account_locked') {
            setStatus("offline");
            return;
        }

        const interval = setInterval(() => {
            if (syncService.isCurrentlySyncing()) {
                setStatus("syncing");
            } else {
                setStatus("synced");
            }
        }, 300);

        return () => clearInterval(interval);
    }, [mode]);

    if (mode === 'local_guest' || mode === 'account_locked') {
        return (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-muted)]" title="Data stored locally">
                <CloudOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Local Only</span>
             </div>
        );
    }

    if (status === 'syncing') {
         return (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--primary)] text-xs font-medium text-[var(--primary)] shadow-[0_0_0_2px_var(--primary-transparent)]" title="Syncing with Cloud">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
             </div>
        );
    }

    return (
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--secondary-alpha)] border border-transparent text-xs font-medium text-[var(--primary)]" title="Synced with Cloud">
            <Cloud className="w-3.5 h-3.5 text-[#007A4D]" />
            <span className="hidden sm:inline text-[#007A4D]">All Synced ✓</span>
         </div>
    );
}
