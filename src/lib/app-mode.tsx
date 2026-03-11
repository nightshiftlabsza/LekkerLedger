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
    unlockAccount: (key: CryptoKey, userId: string) => void;
    lockAccount: () => void;
}

const AppModeContext = React.createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = React.useState<AppMode>("local_guest");
    const supabase = createClient();

    React.useEffect(() => {
        let mounted = true;

        async function initMode() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;
            
            if (session) {
                // They are logged in, but the key is only in memory, so it's always locked on load
                setMode("account_locked");
            } else {
                setMode("local_guest");
            }
        }

        initMode();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT") {
                setMode("local_guest");
                syncEngine.setCryptoKey(null as any);
            } else if (event === "SIGNED_IN" && mode === "local_guest") {
                setMode("account_locked");
            }
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth, mode]);

    const unlockAccount = React.useCallback((key: CryptoKey, userId: string) => {
        syncEngine.setCryptoKey(key);
        syncService.init(userId, key);
        setMode("account_unlocked");
    }, []);

    const lockAccount = React.useCallback(() => {
        syncEngine.setCryptoKey(null as any);
        setMode("account_locked");
    }, []);

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
