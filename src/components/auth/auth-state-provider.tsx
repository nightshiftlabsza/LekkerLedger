"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { clearAllUserDataOnSignOut } from "@/lib/sign-out-cleanup";

export interface AuthUserSnapshot {
    id: string;
    email: string | null;
}

interface AuthStateContextValue {
    user: AuthUserSnapshot | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthStateContext = React.createContext<AuthStateContextValue | null>(null);

function toAuthUserSnapshot(user: Pick<User, "id" | "email"> | null | undefined): AuthUserSnapshot | null {
    if (!user?.id) {
        return null;
    }

    return {
        id: user.id,
        email: user.email ?? null,
    };
}

export function AuthStateProvider({
    initialUser = null,
    children,
}: Readonly<{
    initialUser?: AuthUserSnapshot | null;
    children: React.ReactNode;
}>) {
    const supabase = React.useMemo(() => createClient(), []);
    const [user, setUser] = React.useState<AuthUserSnapshot | null>(initialUser);
    const [isLoading, setIsLoading] = React.useState(initialUser === null);
    const applyUserSnapshot = React.useCallback((nextUser: AuthUserSnapshot | null) => {
        setUser((currentUser) => {
            if (currentUser?.id === nextUser?.id && currentUser?.email === nextUser?.email) {
                return currentUser;
            }

            return nextUser;
        });
    }, []);

    const refreshUser = React.useCallback(async () => {
        try {
            const { data: { user: nextUser } } = await supabase.auth.getUser();
            applyUserSnapshot(toAuthUserSnapshot(nextUser));
        } catch (error) {
            console.warn("Could not refresh the authenticated user from Supabase.", error);
        } finally {
            setIsLoading(false);
        }
    }, [applyUserSnapshot, supabase]);

    const signOut = React.useCallback(async () => {
        try {
            await supabase.auth.signOut();
            applyUserSnapshot(null);
            // Clear all locally persisted user data — paid users' data
            // is cloud-secured and must not remain on the device.
            await clearAllUserDataOnSignOut();
        } catch (error) {
            console.warn("Could not sign out of Supabase.", error);
        }
    }, [applyUserSnapshot, supabase]);

    React.useEffect(() => {
        let mounted = true;

        async function reconcileUserOnce() {
            try {
                const { data: { user: nextUser } } = await supabase.auth.getUser();
                if (!mounted) return;
                applyUserSnapshot(toAuthUserSnapshot(nextUser));
            } catch (error) {
                if (!mounted) return;
                console.warn("Could not restore the authenticated user from Supabase.", error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        if (initialUser === null) {
            void reconcileUserOnce();
        } else {
            setIsLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            applyUserSnapshot(toAuthUserSnapshot(session?.user));
            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [applyUserSnapshot, initialUser, supabase]);

    const contextValue = React.useMemo(() => ({
        user,
        isLoading,
        refreshUser,
        signOut,
    }), [user, isLoading, refreshUser, signOut]);
    
    return (
        <AuthStateContext.Provider value={contextValue}>
            {children}
        </AuthStateContext.Provider>
    );
}

export function useAuthState(): AuthStateContextValue {
    const context = React.useContext(AuthStateContext);

    if (context) {
        return context;
    }

    return {
        user: null,
        isLoading: false,
        refreshUser: async () => undefined,
        signOut: async () => undefined,
    };
}
