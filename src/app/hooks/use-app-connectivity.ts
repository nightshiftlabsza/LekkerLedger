"use client";

import * as React from "react";

export type NetworkState = "online" | "offline" | "flaky";
export type SyncState = "disabled" | "enabled" | "error" | "reconnecting";
export type PaymentsState = "available" | "unavailable";

async function probeSameOriginConnectivity(): Promise<boolean> {
    if (typeof window === "undefined") return true;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(`/manifest.webmanifest?check=${Date.now()}`, {
            cache: "no-store",
            signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        window.clearTimeout(timeout);
    }
}

export function useAppConnectivity() {
    const [network, setNetwork] = React.useState<NetworkState>("online");
    const [sync, setSync] = React.useState<SyncState>("disabled");
    const [payments, setPayments] = React.useState<PaymentsState>("available");

    React.useEffect(() => {
        let active = true;
        let latestCheck = 0;

        const applyNetworkState = (next: NetworkState, checkId?: number) => {
            if (!active) return;
            if (typeof checkId === "number" && checkId !== latestCheck) return;
            setNetwork(next);
        };

        const verifyNetwork = async () => {
            const checkId = ++latestCheck;

            if (!navigator.onLine) {
                const reachable = await probeSameOriginConnectivity();
                applyNetworkState(reachable ? "online" : "offline", checkId);
                return;
            }

            applyNetworkState("online", checkId);
        };

        const handleOnline = () => {
            latestCheck += 1;
            applyNetworkState("online");
        };
        const handleOffline = () => {
            void verifyNetwork();
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void verifyNetwork();
            }
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        void verifyNetwork();

        async function checkSync() {
            // TODO: In Batch 2, check Supabase auth state for sync status
            if (active) setSync("disabled");
        }

        void checkSync();

        return () => {
            active = false;
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
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
