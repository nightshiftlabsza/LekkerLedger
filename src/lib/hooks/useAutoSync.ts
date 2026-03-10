"use client";

import { useEffect, useRef } from "react";
import { getSettings, subscribeToDataChanges } from "@/lib/storage";
import { syncDataToDrive } from "@/lib/google-drive";
import { getStoredGoogleAccessToken, hasStoredGoogleDriveScope } from "@/lib/google-session";

const DEBOUNCE_MS = 3_000;
const INTERVAL_MS = 5 * 60 * 1_000;

/**
 * Mounts in AppShell. When a paid user has Google Drive connected and
 * autoBackupEnabled is true, silently syncs to Drive:
 *  - 3 seconds after any data change (debounced)
 *  - Every 5 minutes regardless
 */
export function useAutoSync() {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoBackupRef = useRef(false);

    useEffect(() => {
        // Load the setting once on mount; also re-read on each trigger so
        // the user toggling the switch in Settings takes effect immediately.
        async function readSetting() {
            const s = await getSettings();
            autoBackupRef.current = Boolean(s.autoBackupEnabled);
        }
        void readSetting();

        async function triggerSync() {
            // Re-read setting on every trigger so toggle changes are respected.
            const s = await getSettings();
            autoBackupRef.current = Boolean(s.autoBackupEnabled);

            if (!autoBackupRef.current) return;
            const token = getStoredGoogleAccessToken();
            if (!token || !hasStoredGoogleDriveScope()) return;

            await syncDataToDrive(token);
        }

        // Subscribe to any data write via the existing notifyListeners mechanism.
        const unsubscribe = subscribeToDataChanges(() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                void triggerSync();
            }, DEBOUNCE_MS);
        });

        // 5-minute interval as a safety net.
        const interval = setInterval(() => {
            void triggerSync();
        }, INTERVAL_MS);

        return () => {
            unsubscribe();
            clearInterval(interval);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);
}
