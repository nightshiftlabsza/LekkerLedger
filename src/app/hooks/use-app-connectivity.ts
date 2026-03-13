"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { syncService } from "@/lib/sync-service";

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
    const [payments, setPayments] = React.useState<PaymentsState>("available");
    const [hasAuthenticatedSession, setHasAuthenticatedSession] = React.useState(false);
    const supabase = React.useMemo(() => createClient(), []);
    const syncSnapshot = React.useSyncExternalStore(
        (listener) => syncService.subscribe(() => listener()),
        () => syncService.getSnapshot(),
        () => syncService.getSnapshot(),
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

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        void verifyNetwork();

        return () => {
            active = false;
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    React.useEffect(() => {
        let mounted = true;

        async function loadSession() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;
                setHasAuthenticatedSession(Boolean(session?.user?.id));
            } catch (error) {
                if (!mounted) return;
                console.warn("Could not read auth session while checking connectivity.", error);
                setHasAuthenticatedSession(false);
            }
        }

        void loadSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setHasAuthenticatedSession(Boolean(session?.user?.id));
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    const sync = React.useMemo<SyncState>(() => {
        if (!hasAuthenticatedSession || !syncSnapshot.ready) {
            return "disabled";
        }

        if (network !== "online") {
            return "reconnecting";
        }

        if (syncSnapshot.hasError) {
            return "error";
        }

        return "enabled";
    }, [hasAuthenticatedSession, network, syncSnapshot.hasError, syncSnapshot.ready]);

    return {
        network,
        sync,
        payments,
        setNetwork,
        setPayments,
    };
}
