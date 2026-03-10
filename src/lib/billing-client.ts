"use client";

import { BillingCycle, PlanId } from "../config/plans";
import { BillingAccountSummary, getFreeEntitlements, VerifiedEntitlements } from "./billing";
import { getStoredGoogleAccessToken } from "./google-session";

interface CachedEntitlements {
    token: string;
    fetchedAt: number;
    value: VerifiedEntitlements;
}

const ENTITLEMENTS_CACHE_TTL_MS = 30_000;
let cachedEntitlements: CachedEntitlements | null = null;

export interface BillingAccountPayload {
    entitlements: VerifiedEntitlements;
    account: BillingAccountSummary;
}

async function buildErrorMessage(response: Response, fallback: string): Promise<Error> {
    try {
        const data = await response.json();
        return new Error(typeof data?.error === "string" ? data.error : fallback);
    } catch {
        return new Error(fallback);
    }
}

export function clearVerifiedEntitlementsCache() {
    cachedEntitlements = null;
}

export async function fetchVerifiedEntitlements(accessToken = getStoredGoogleAccessToken(), force = false): Promise<VerifiedEntitlements | null> {
    if (!accessToken) return null;

    if (!force && cachedEntitlements && cachedEntitlements.token === accessToken && (Date.now() - cachedEntitlements.fetchedAt) < ENTITLEMENTS_CACHE_TTL_MS) {
        return cachedEntitlements.value;
    }

    const response = await fetch("/api/entitlements", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (response.status === 401) {
        clearVerifiedEntitlementsCache();
        return null;
    }

    if (!response.ok) {
        if (cachedEntitlements && cachedEntitlements.token === accessToken) {
            return cachedEntitlements.value;
        }

        throw await buildErrorMessage(response, "Billing status could not be verified.");
    }

    const data = await response.json();
    const entitlements = (data?.entitlements as VerifiedEntitlements | undefined) ?? getFreeEntitlements();
    cachedEntitlements = {
        token: accessToken,
        fetchedAt: Date.now(),
        value: entitlements,
    };
    return entitlements;
}

export async function createCheckoutSession(
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle },
    accessToken = getStoredGoogleAccessToken(),
): Promise<{ authorizationUrl: string; reference: string }> {
    if (!accessToken) {
        throw new Error("Google sign-in is required before starting paid checkout.");
    }

    const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(input),
    });

    if (response.status === 401) {
        throw new Error("Google sign-in is required before starting paid checkout.");
    }

    if (!response.ok) {
        throw await buildErrorMessage(response, "Checkout could not be started.");
    }

    const data = await response.json();
    return {
        authorizationUrl: data.authorizationUrl as string,
        reference: data.reference as string,
    };
}

export async function startTrialCheckout(
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle; referralCode?: string | null },
    accessToken = getStoredGoogleAccessToken(),
): Promise<{ authorizationUrl: string; reference: string }> {
    if (!accessToken) {
        throw new Error("Google sign-in is required before starting a trial.");
    }

    const response = await fetch("/api/billing/trial/start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(input),
    });

    if (response.status === 401) {
        throw new Error("Google sign-in is required before starting a trial.");
    }

    if (!response.ok) {
        throw await buildErrorMessage(response, "The free trial could not be started.");
    }

    const data = await response.json();
    return {
        authorizationUrl: data.authorizationUrl as string,
        reference: data.reference as string,
    };
}

export async function createInlineTrialIntent(
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle; email: string; referralCode?: string | null },
): Promise<{ reference: string; amountCents: number }> {
    const response = await fetch("/api/billing/trial/intent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw await buildErrorMessage(response, "The payment popup could not be opened.");
    }

    const data = await response.json();
    return {
        reference: data.reference as string,
        amountCents: data.amountCents as number,
    };
}

export async function fetchBillingAccount(accessToken = getStoredGoogleAccessToken()): Promise<BillingAccountPayload | null> {
    if (!accessToken) return null;

    const response = await fetch("/api/billing/account", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (response.status === 401) {
        clearVerifiedEntitlementsCache();
        return null;
    }

    if (!response.ok) {
        throw await buildErrorMessage(response, "Billing details could not be loaded.");
    }

    const data = await response.json();
    return {
        entitlements: (data?.entitlements as VerifiedEntitlements | undefined) ?? getFreeEntitlements(),
        account: data?.account as BillingAccountSummary,
    };
}

export async function confirmBillingTransaction(reference: string, accessToken = getStoredGoogleAccessToken()): Promise<BillingAccountPayload> {
    if (!accessToken) {
        throw new Error("Google sign-in is required before confirming payment.");
    }

    const response = await fetch("/api/billing/confirm", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reference }),
        cache: "no-store",
    });

    if (response.status === 401) {
        throw new Error("Google sign-in is required before confirming payment.");
    }

    if (!response.ok) {
        throw await buildErrorMessage(response, "Payment confirmation could not be completed.");
    }

    const data = await response.json();
    clearVerifiedEntitlementsCache();
    return {
        entitlements: (data?.entitlements as VerifiedEntitlements | undefined) ?? getFreeEntitlements(),
        account: data?.account as BillingAccountSummary,
    };
}

export async function cancelSubscriptionRenewal(accessToken = getStoredGoogleAccessToken()): Promise<BillingAccountPayload> {
    if (!accessToken) {
        throw new Error("Google sign-in is required before canceling renewal.");
    }

    const response = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.status === 401) {
        throw new Error("Google sign-in is required before canceling renewal.");
    }

    if (!response.ok) {
        throw await buildErrorMessage(response, "Renewal could not be canceled.");
    }

    const data = await response.json();
    clearVerifiedEntitlementsCache();
    return {
        entitlements: data.entitlements as VerifiedEntitlements,
        account: data.account as BillingAccountSummary,
    };
}
