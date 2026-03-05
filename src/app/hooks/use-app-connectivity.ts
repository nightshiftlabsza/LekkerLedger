"use client";

import * as React from "react";
import { getSettings } from "@/lib/storage";

export function useAppConnectivity() {
    const [isOnline, setIsOnline] = React.useState(true);
    const [syncError, setSyncError] = React.useState(false);

    // We'll mock a payments error state for now, but provide a way to set it
    const [paymentsError, setPaymentsError] = React.useState(false);

    React.useEffect(() => {
        // Initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check if Drive is configured but token is expired
        // In a real implementation this would check the actual token validity
        async function checkSync() {
            try {
                const s = await getSettings();
                if (s?.googleSyncEnabled && s?.googleAuthToken) {
                    // Check if token looks expired (mock validation for now)
                    // if (Date.now() > tokenExpiry) setSyncError(true);
                }
            } catch (err) {
                console.error("Failed to check sync status:", err);
            }
        }

        checkSync();

        return () => {
            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);
        };
    }, []);

    return {
        isOnline,
        syncError,
        paymentsError,
        setSyncError,
        setPaymentsError
    };
}
