"use client";

import * as React from "react";
import { getSettings } from "@/lib/storage";

export type NetworkState = "online" | "offline" | "flaky";
export type SyncState = "disabled" | "enabled" | "error" | "reconnecting";
export type PaymentsState = "available" | "unavailable";

function hasSessionGoogleToken(): boolean {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem("google_access_token");
}

export function useAppConnectivity() {
    const [network, setNetwork] = React.useState<NetworkState>("online");
    const [sync, setSync] = React.useState<SyncState>("disabled");
    const [payments, setPayments] = React.useState<PaymentsState>("available");

    React.useEffect(() => {
        setNetwork(navigator.onLine ? "online" : "offline");

        const handleOnline = () => setNetwork("online");
        const handleOffline = () => setNetwork("offline");

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        async function checkSync() {
            try {
                const settings = await getSettings();
                if (settings?.googleSyncEnabled && hasSessionGoogleToken()) {
                    setSync("enabled");
                } else {
                    setSync("disabled");
                }
            } catch (error) {
                console.error("Failed to check sync status:", error);
                setSync("error");
            }
        }

        void checkSync();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return {
        network,
        sync,
        payments,
        setNetwork,
        setSync,
        setPayments,
    };
}
