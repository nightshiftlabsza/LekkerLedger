"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthState, type AuthUserSnapshot } from "@/components/auth/auth-state-provider";
import { useAppMode } from "@/lib/app-mode";
import {
    confirmBillingTransaction,
    confirmGuestBillingTransaction,
    fetchBillingAccount,
    type BillingAccountPayload,
} from "@/lib/billing-client";
import {
    clearPendingBillingHandoff,
    readPendingBillingReference,
    writePendingBillingReference,
} from "@/lib/billing-handoff";
import { applyVerifiedEntitlementsToSettings, getPlanById } from "@/lib/entitlements";
import {
    buildDefaultHousehold,
    getHouseholds,
    getSettings,
    saveSettings,
    subscribeToDataChanges,
} from "@/lib/storage";
import { PAID_LOGIN_SUCCESS_QUERY, buildPaidDashboardHref } from "@/lib/paid-activation";
import type { EmployerSettings, Household } from "@/lib/schema";
import { endAppMetric, startAppMetric } from "@/lib/app-performance";

type AuthStatus = "loading" | "signed_out" | "signed_in";
type UnlockStatus = "not_needed" | "pending" | "required" | "resolved";
type SubscriptionStatus = "idle" | "loading" | "resolved" | "error";
type ActivationStatus = "idle" | "pending" | "success" | "error";

interface AppBootstrapContextValue {
    authStatus: AuthStatus;
    user: AuthUserSnapshot | null;
    unlockStatus: UnlockStatus;
    subscriptionStatus: SubscriptionStatus;
    subscriptionError: string | null;
    activationStatus: ActivationStatus;
    activationError: string | null;
    billingAccount: BillingAccountPayload | null;
    households: Household[];
    localSettings: EmployerSettings | null;
    effectiveSettings: EmployerSettings | null;
    localSnapshotReady: boolean;
    isReadyForPlanUI: boolean;
    isReadyForDashboard: boolean;
    resolvedPlanId: "free" | "standard" | "pro" | null;
    resolvedPlanLabel: string | null;
    refreshBillingAccount: () => Promise<void>;
}

const AppBootstrapContext = React.createContext<AppBootstrapContextValue | null>(null);

function toMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function hasMatchingBillingCache(current: EmployerSettings | null, next: EmployerSettings | null) {
    return current?.proStatus === next?.proStatus
        && current?.paidUntil === next?.paidUntil
        && current?.billingCycle === next?.billingCycle;
}

async function waitForRetry(delayMs: number) {
    await new Promise((resolve) => {
        globalThis.setTimeout(resolve, delayMs);
    });
}

async function confirmPaidAccountWithRetries(paymentReference: string) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const account = await confirmBillingTransaction(paymentReference);
            return { account, lastError };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Paid activation could not be completed.");
            if (attempt < 2) {
                await waitForRetry(900);
            }
        }
    }

    return { account: null, lastError };
}

export function AppBootstrapProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useAuthState();
    const { mode } = useAppMode();
    const [households, setHouseholds] = React.useState<Household[]>([buildDefaultHousehold()]);
    const [localSettings, setLocalSettings] = React.useState<EmployerSettings | null>(null);
    const [localSnapshotReady, setLocalSnapshotReady] = React.useState(false);
    const [billingAccount, setBillingAccount] = React.useState<BillingAccountPayload | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus>("idle");
    const [subscriptionError, setSubscriptionError] = React.useState<string | null>(null);
    const [activationStatus, setActivationStatus] = React.useState<ActivationStatus>("idle");
    const [activationError, setActivationError] = React.useState<string | null>(null);
    const lastBillingUserIdRef = React.useRef<string | null>(null);

    let authStatus: AuthStatus = "signed_out";
    if (authLoading) {
        authStatus = "loading";
    } else if (user?.id) {
        authStatus = "signed_in";
    }

    let unlockStatus: UnlockStatus = "not_needed";
    if (authStatus === "signed_in") {
        if (mode === "account_unlocked") {
            unlockStatus = "resolved";
        } else if (mode === "account_locked") {
            unlockStatus = "required";
        } else {
            unlockStatus = "pending";
        }
    }

    const paidLoginRequested = pathname === "/dashboard" && searchParams.get("paidLogin") === "1";
    const paymentReference = searchParams.get("reference")?.trim() || readPendingBillingReference() || "";

    const loadLocalSnapshot = React.useCallback(async () => {
        const [loadedHouseholds, loadedSettings] = await Promise.all([
            getHouseholds(),
            getSettings(),
        ]);
        setHouseholds(loadedHouseholds.length > 0 ? loadedHouseholds : [buildDefaultHousehold()]);
        setLocalSettings(loadedSettings);
        setLocalSnapshotReady(true);
    }, []);

    React.useEffect(() => {
        if (authLoading) {
            return;
        }

        let active = true;

        async function syncLocalSnapshot() {
            try {
                await loadLocalSnapshot();
            } catch (error) {
                if (!active) {
                    return;
                }

                console.error("Could not load the local app snapshot.", error);
                setHouseholds([buildDefaultHousehold()]);
                setLocalSettings(null);
                setLocalSnapshotReady(true);
            }
        }

        syncLocalSnapshot().catch(() => undefined);
        const unsubscribe = subscribeToDataChanges(() => {
            syncLocalSnapshot().catch(() => undefined);
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [authLoading, loadLocalSnapshot]);

    const refreshBillingAccount = React.useCallback(async () => {
        if (!user?.id) {
            setBillingAccount(null);
            setSubscriptionStatus("resolved");
            setSubscriptionError(null);
            return;
        }

        setSubscriptionStatus("loading");
        setSubscriptionError(null);
        startAppMetric("subscription_resolved_after_login");

        try {
            const nextBillingAccount = await fetchBillingAccount();
            setBillingAccount(nextBillingAccount);
            setSubscriptionStatus("resolved");
            endAppMetric("subscription_resolved_after_login", {
                plan_id: nextBillingAccount?.entitlements.planId ?? "free",
                has_paid_access: Boolean(nextBillingAccount?.entitlements.isActive && nextBillingAccount.entitlements.planId !== "free"),
            });
        } catch (error) {
            const message = toMessage(error, "Billing details could not be loaded.");
            setBillingAccount(null);
            setSubscriptionStatus("error");
            setSubscriptionError(message);
        }
    }, [user?.id]);

    React.useEffect(() => {
        if (authStatus === "signed_in" && user?.id && lastBillingUserIdRef.current !== user.id) {
            startAppMetric("auth_resolved_after_login");
            endAppMetric("auth_resolved_after_login", {
                auth_state: "signed_in",
            });
            lastBillingUserIdRef.current = user.id;
        }

        if (authStatus === "signed_out") {
            lastBillingUserIdRef.current = null;
            setBillingAccount(null);
            setSubscriptionStatus("resolved");
            setSubscriptionError(null);
            setActivationStatus("idle");
            setActivationError(null);
        }
    }, [authStatus, user?.id]);

    React.useEffect(() => {
        if (authStatus !== "signed_in" || !user?.id) {
            return;
        }

        if (paidLoginRequested) {
            return;
        }

        refreshBillingAccount().catch(() => undefined);
    }, [authStatus, paidLoginRequested, refreshBillingAccount, user?.id]);

    React.useEffect(() => {
        if (paidLoginRequested) {
            return;
        }

        setActivationStatus("idle");
        setActivationError(null);
    }, [paidLoginRequested]);

    React.useEffect(() => {
        if (!paidLoginRequested) {
            return;
        }

        if (authStatus !== "signed_in") {
            return;
        }

        if (!paymentReference) {
            setActivationStatus("error");
            setActivationError("We could not find your payment reference. Please log in again from the payment handoff.");
            return;
        }

        let active = true;

        async function activatePaidAccess() {
            setActivationStatus("pending");
            setActivationError(null);
            setSubscriptionStatus("loading");
            writePendingBillingReference(paymentReference);
            startAppMetric("subscription_resolved_after_login");

            try {
                const { account, lastError } = await confirmPaidAccountWithRetries(paymentReference);

                if (!active) {
                    return;
                }

                if (!account) {
                    const guestStatus = await confirmGuestBillingTransaction(paymentReference).catch(() => null);
                    if (guestStatus?.paid) {
                        throw new Error(lastError?.message || "Your payment was found, but the paid account could not be activated yet.");
                    }

                    throw lastError || new Error("Paid activation could not be completed.");
                }

                if (account.entitlements.planId === "free" || !account.entitlements.isActive) {
                    throw new Error(account.account.lastError || "Your payment was found, but paid access is not active yet.");
                }

                clearPendingBillingHandoff();
                setBillingAccount(account);
                setSubscriptionStatus("resolved");
                setSubscriptionError(null);
                setActivationStatus("success");
                endAppMetric("subscription_resolved_after_login", {
                    plan_id: account.entitlements.planId,
                    activation_flow: true,
                    has_paid_access: true,
                });
                router.replace(buildPaidDashboardHref({ activation: PAID_LOGIN_SUCCESS_QUERY }));
            } catch (error) {
                if (!active) {
                    return;
                }

                setBillingAccount(null);
                setSubscriptionStatus("error");
                setSubscriptionError(toMessage(error, "Paid activation could not be completed."));
                setActivationStatus("error");
                setActivationError(toMessage(error, "Paid activation could not be completed."));
            }
        }

        activatePaidAccess().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [authStatus, paidLoginRequested, paymentReference, router]);

    const effectiveSettings = React.useMemo(() => {
        return applyVerifiedEntitlementsToSettings(localSettings, billingAccount?.entitlements) ?? localSettings;
    }, [billingAccount?.entitlements, localSettings]);

    React.useEffect(() => {
        if (!user?.id || subscriptionStatus !== "resolved" || !effectiveSettings || !localSettings) {
            return;
        }

        if (hasMatchingBillingCache(localSettings, effectiveSettings)) {
            return;
        }

        let active = true;

        async function syncResolvedPlanCache() {
            try {
                await saveSettings(effectiveSettings);
            } catch (error) {
                if (!active) {
                    return;
                }

                console.warn("Could not cache the resolved billing plan locally.", error);
            }
        }

        syncResolvedPlanCache().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [effectiveSettings, localSettings, subscriptionStatus, user?.id]);

    const resolvedPlanId = React.useMemo(() => {
        if (authStatus === "signed_out") {
            return "free";
        }

        if (subscriptionStatus !== "resolved") {
            return null;
        }

        return billingAccount?.entitlements.isActive
            ? billingAccount.entitlements.planId
            : "free";
    }, [authStatus, billingAccount, subscriptionStatus]);

    const resolvedPlanLabel = React.useMemo(() => {
        if (!resolvedPlanId) {
            return null;
        }

        return getPlanById(resolvedPlanId).label;
    }, [resolvedPlanId]);

    const isReadyForPlanUI = authStatus !== "signed_in" || subscriptionStatus === "resolved";
    const isReadyForDashboard = authStatus !== "loading"
        && localSnapshotReady
        && activationStatus !== "pending"
        && (authStatus !== "signed_in" || subscriptionStatus === "resolved");

    const contextValue = React.useMemo<AppBootstrapContextValue>(() => ({
        authStatus,
        user,
        unlockStatus,
        subscriptionStatus,
        subscriptionError,
        activationStatus,
        activationError,
        billingAccount,
        households,
        localSettings,
        effectiveSettings,
        localSnapshotReady,
        isReadyForPlanUI,
        isReadyForDashboard,
        resolvedPlanId,
        resolvedPlanLabel,
        refreshBillingAccount,
    }), [
        activationError,
        activationStatus,
        authStatus,
        billingAccount,
        effectiveSettings,
        households,
        isReadyForDashboard,
        isReadyForPlanUI,
        localSettings,
        localSnapshotReady,
        refreshBillingAccount,
        resolvedPlanId,
        resolvedPlanLabel,
        subscriptionError,
        subscriptionStatus,
        unlockStatus,
        user,
    ]);

    return (
        <AppBootstrapContext.Provider value={contextValue}>
            {children}
        </AppBootstrapContext.Provider>
    );
}

export function useAppBootstrap() {
    const context = React.useContext(AppBootstrapContext);

    if (!context) {
        throw new Error("useAppBootstrap must be used within an AppBootstrapProvider");
    }

    return context;
}
