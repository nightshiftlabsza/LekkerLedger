"use client";

import * as React from "react";
import { createClient } from "./supabase/client";
import { syncEngine } from "./sync-engine";

import { syncService } from "./sync-service";

/**
 * Detailed representation of the app's current operating mode.
 * - 'local_guest': No account, data lives only securely in local device storage.
 * - 'account_unlocked': User is logged into Supabase AND has a valid memory crypto key. Fully capable of syncing.
 * - 'account_locked': User is logged in, but we still need them to provide their recovery key.
 */
export type AppMode = "local_guest" | "account_unlocked" | "account_locked";

interface AppModeContextValue {
    mode: AppMode;
    setMode: React.Dispatch<React.SetStateAction<AppMode>>;
    unlockAccount: (key: CryptoKey, userId: string) => Promise<void>;
    lockAccount: () => void;
}

const AppModeContext = React.createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = React.useState<AppMode>("local_guest");
    const supabase = React.useMemo(() => createClient(), []);
    const modeRef = React.useRef<AppMode>(mode);
    const currentUserIdRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    const clearUnlockedState = React.useCallback(() => {
        syncEngine.setCryptoKey(null);
        syncService.clearSession();
    }, []);

    const transitionToLocked = React.useCallback(() => {
        clearUnlockedState();
        setMode("account_locked");
    }, [clearUnlockedState]);

    const transitionToGuest = React.useCallback(() => {
        clearUnlockedState();
        currentUserIdRef.current = null;
        setMode("local_guest");
    }, [clearUnlockedState]);

    React.useEffect(() => {
        let mounted = true;

        async function initMode() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                currentUserIdRef.current = session?.user?.id ?? null;

                if (session?.user?.id) {
                    setMode("account_locked");
                    return;
                }
            } catch (error) {
                console.warn("Could not restore Supabase session. Falling back to signed-out mode.", error);
            }

            transitionToGuest();
        }

        initMode();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const nextUserId = session?.user?.id ?? null;
            const previousUserId = currentUserIdRef.current;
            currentUserIdRef.current = nextUserId;

            if (event === "SIGNED_OUT") {
                transitionToGuest();
                return;
            }

            if (event !== "SIGNED_IN" || !nextUserId) {
                return;
            }

            const isFreshAuthenticatedEntry = modeRef.current === "local_guest";
            const isDifferentUser = Boolean(previousUserId && previousUserId !== nextUserId);

            if (isFreshAuthenticatedEntry || isDifferentUser) {
                transitionToLocked();
            }
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [supabase, transitionToGuest, transitionToLocked]);

    const unlockAccount = React.useCallback(async (key: CryptoKey, userId: string) => {
        currentUserIdRef.current = userId;
        syncEngine.setCryptoKey(key);
        syncService.init(userId, key);
        await syncService.reconcileAfterUnlock();
        setMode("account_unlocked");
    }, []);

    const lockAccount = React.useCallback(() => {
        transitionToLocked();
    }, [transitionToLocked]);

    return (
        <AppModeContext.Provider value={{ mode, setMode, unlockAccount, lockAccount }}>
            {children}
        </AppModeContext.Provider>
    );
}

export function useAppMode() {
    const context = React.useContext(AppModeContext);
    if (!context) {
        throw new Error("useAppMode must be used within an AppModeProvider");
    }
    return context;
}
