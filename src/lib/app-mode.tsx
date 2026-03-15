"use client";

import * as React from "react";
import { useAuthState } from "@/components/auth/auth-state-provider";
import { useRealtimeSync } from "../hooks/use-realtime-sync";
import { loadEncryptionProfileState } from "./encryption-profile";
import { type EncryptionMode } from "./encryption-mode";
import { deriveKey, importAccountMasterKey } from "./crypto";
import { getLocalRecoveryProfile } from "./recovery-profile-store";
import { createClient } from "./supabase/client";
import { syncEngine } from "./sync-engine";
import { syncService } from "./sync-service";

/**
 * Detailed representation of the app's current operating mode.
 * - 'local_guest': No account, data lives only securely in local device storage.
 * - 'account_unlocked': User is logged into Supabase AND has a valid memory crypto key. Fully capable of syncing.
 * - 'account_locked': User is logged in, but this device still needs the secure unlock step.
 */
export type AppMode = "local_guest" | "account_unlocked" | "account_locked";

interface AppModeContextValue {
    mode: AppMode;
    encryptionMode: EncryptionMode | null;
    setEncryptionMode: React.Dispatch<React.SetStateAction<EncryptionMode | null>>;
    setMode: React.Dispatch<React.SetStateAction<AppMode>>;
    unlockAccount: (key: CryptoKey, userId: string) => Promise<void>;
    lockAccount: () => void;
}

const AppModeContext = React.createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = React.useState<AppMode>("local_guest");
    const [encryptionMode, setEncryptionMode] = React.useState<EncryptionMode | null>(null);
    const [authenticatedUserId, setAuthenticatedUserId] = React.useState<string | null>(null);
    const supabase = React.useMemo(() => createClient(), []);
    const currentUserIdRef = React.useRef<string | null>(null);
    const { user, isLoading: authLoading } = useAuthState();

    const clearUnlockedState = React.useCallback(() => {
        syncEngine.setCryptoKey(null);
        syncService.clearSession();
    }, []);

    const transitionToLocked = React.useCallback(() => {
        clearUnlockedState();
        setEncryptionMode(null);
        setMode("account_locked");
    }, [clearUnlockedState]);

    const transitionToGuest = React.useCallback(() => {
        clearUnlockedState();
        currentUserIdRef.current = null;
        setAuthenticatedUserId(null);
        setEncryptionMode(null);
        setMode("local_guest");
    }, [clearUnlockedState]);

    useRealtimeSync(mode === "account_unlocked" ? authenticatedUserId ?? undefined : undefined, () => undefined);

    React.useEffect(() => {
        let mounted = true;

        async function initMode() {
            if (authLoading) {
                return;
            }

            try {
                const userId = user?.id ?? null;
                currentUserIdRef.current = userId;
                setAuthenticatedUserId(userId);

                if (!userId) {
                    transitionToGuest();
                    return;
                }

                try {
                    const profileState = await loadEncryptionProfileState(userId, supabase);
                    const storedRecoveryProfile = await getLocalRecoveryProfile(userId);
                    if (!mounted) return;

                    setEncryptionMode(profileState.source === "none" ? null : profileState.encryptionMode);

                    if (profileState.keySetupComplete && profileState.encryptionMode === "recoverable" && storedRecoveryProfile?.cachedMasterKey) {
                        const key = await importAccountMasterKey(storedRecoveryProfile.cachedMasterKey);
                        syncEngine.setCryptoKey(key);
                        syncService.init(userId, key);
                        setMode("account_unlocked");
                        void syncService.reconcileAfterUnlock().catch((error) => {
                            console.warn("Could not refresh cloud data during automatic unlock.", error);
                        });
                        return;
                    }

                    const canUseLegacyRecoveryKey = profileState.encryptionMode === "maximum_privacy" || profileState.source === "legacy_local" || profileState.source === "cloud_data";
                    if (canUseLegacyRecoveryKey && storedRecoveryProfile?.recoveryKey) {
                        const key = await deriveKey(storedRecoveryProfile.recoveryKey);
                        syncEngine.setCryptoKey(key);
                        syncService.init(userId, key);
                        setMode("account_unlocked");
                        void syncService.reconcileAfterUnlock().catch((error) => {
                            console.warn("Could not refresh cloud data during automatic unlock.", error);
                        });
                        return;
                    }
                } catch (e) {
                    if (!mounted) return;
                    console.warn("Auto-unlock failed", e);
                }

                if (!mounted) return;
                setMode("account_locked");
            } catch (error) {
                if (!mounted) return;
                console.warn("Could not restore encrypted account mode. Falling back to signed-out mode.", error);
                transitionToGuest();
            }
        }

        void initMode();

        return () => {
            mounted = false;
        };
    }, [authLoading, supabase, transitionToGuest, transitionToLocked, user?.id]);

    React.useEffect(() => {
        if (mode !== "account_unlocked" || !authenticatedUserId) {
            return;
        }

        const refreshFromCloud = () => {
            void syncService.restoreFromCloud().catch((error) => {
                console.warn("Could not refresh cloud data after the session became visible.", error);
            });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refreshFromCloud();
            }
        };

        const handleOnline = () => {
            refreshFromCloud();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        globalThis.addEventListener("online", handleOnline);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            globalThis.removeEventListener("online", handleOnline);
        };
    }, [authenticatedUserId, mode]);

    const unlockAccount = React.useCallback(async (key: CryptoKey, userId: string) => {
        currentUserIdRef.current = userId;
        setAuthenticatedUserId(userId);
        syncEngine.setCryptoKey(key);
        syncService.init(userId, key);
        await syncService.reconcileAfterUnlock();
        setMode("account_unlocked");
    }, []);

    const lockAccount = React.useCallback(() => {
        transitionToLocked();
    }, [transitionToLocked]);

    const contextValue = React.useMemo(() => ({
        mode,
        encryptionMode,
        setEncryptionMode,
        setMode,
        unlockAccount,
        lockAccount,
    }), [mode, encryptionMode, setEncryptionMode, setMode, unlockAccount, lockAccount]);

    return (
        <AppModeContext.Provider value={contextValue}>
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
