"use client";

import * as React from "react";
import { useAuthState } from "@/components/auth/auth-state-provider";
import { syncService } from "@/lib/sync-service";

export type NetworkState = "online" | "offline" | "flaky";
export type SyncState = "disabled" | "enabled" | "error" | "reconnecting";
export type PaymentsState = "available" | "unavailable";

async function probeSameOriginConnectivity(): Promise<boolean> {
    if (typeof globalThis.window === "undefined") return true;

    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(`/manifest.webmanifest?check=${Date.now()}`, {
            cache: "no-store",
            signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        globalThis.clearTimeout(timeout);
    }
}

export function useAppConnectivity() {
    const [network, setNetwork] = React.useState<NetworkState>("online");
    const [payments, setPayments] = React.useState<PaymentsState>("available");
    const { user } = useAuthState();
    const subscribeToSyncService = React.useCallback((listener: () => void) => {
        return syncService.subscribe(listener);
    }, []);
    const getSyncSnapshot = React.useCallback(() => syncService.getSnapshot(), []);
    const syncSnapshot = React.useSyncExternalStore(
        subscribeToSyncService,
        getSyncSnapshot,
        getSyncSnapshot,
    );

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

        globalThis.addEventListener("online", handleOnline);
        globalThis.addEventListener("offline", handleOffline);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        void verifyNetwork();

        return () => {
            active = false;
            globalThis.removeEventListener("online", handleOnline);
            globalThis.removeEventListener("offline", handleOffline);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const sync = React.useMemo<SyncState>(() => {
        if (!user?.id || !syncSnapshot.ready) {
            return "disabled";
        }

        if (network !== "online") {
            return "reconnecting";
        }

        if (syncSnapshot.hasError) {
            return "error";
        }

        return "enabled";
    }, [network, syncSnapshot.hasError, syncSnapshot.ready, user?.id]);

    return {
        network,
        sync,
        syncErrorMessage: syncSnapshot.lastError,
        payments,
        setNetwork,
        setPayments,
    };
}
