"use client";

import { BillingCycle, PlanId } from "../config/plans";
import { BillingAccountSummary, getFreeEntitlements, VerifiedEntitlements } from "./billing";
import { createClient } from "./supabase/client";

interface CachedEntitlements {
    sessionKey: string;
    fetchedAt: number;
    value: VerifiedEntitlements;
}

const ENTITLEMENTS_CACHE_TTL_MS = 30_000;
let cachedEntitlements: CachedEntitlements | null = null;

export interface BillingAccountPayload {
    entitlements: VerifiedEntitlements;
    account: BillingAccountSummary;
}

async function getAuthContext(accessToken?: string | null): Promise<{ accessToken: string | null; sessionKey: string }> {
    if (accessToken) {
        return {
            accessToken,
            sessionKey: accessToken,
        };
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    return {
        accessToken: session?.access_token ?? null,
        sessionKey: session?.user?.id ?? "anonymous",
    };
}

async function buildAuthHeaders(accessToken?: string | null): Promise<Record<string, string>> {
    const { accessToken: resolvedToken } = await getAuthContext(accessToken);
    if (!resolvedToken) {
        return {};
    }

    return {
        Authorization: `Bearer ${resolvedToken}`,
    };
}

async function buildErrorMessage(response: Response, fallback: string): Promise<Error> {
    const responseText = await response.text();

    try {
        const data = JSON.parse(responseText);
        return new Error(typeof data?.error === "string" ? data.error : fallback);
    } catch {
        const trimmed = responseText.trim();
        if (trimmed && !trimmed.startsWith("<")) {
            return new Error(trimmed);
        }

        return new Error(`${fallback} (HTTP ${response.status})`);
    }
}

export function clearVerifiedEntitlementsCache() {
    cachedEntitlements = null;
}

export async function fetchVerifiedEntitlements(accessToken?: string | null, force = false): Promise<VerifiedEntitlements | null> {
    const { sessionKey } = await getAuthContext(accessToken);

    if (!force && cachedEntitlements?.sessionKey === sessionKey && (Date.now() - cachedEntitlements.fetchedAt) < ENTITLEMENTS_CACHE_TTL_MS) {
        return cachedEntitlements.value;
    }

    const authHeaders = await buildAuthHeaders(accessToken);
    const response = await fetch("/api/entitlements", {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
    });

    if (response.status === 401) {
        clearVerifiedEntitlementsCache();
        return null;
    }

    if (!response.ok) {
        if (cachedEntitlements?.sessionKey === sessionKey) {
            return cachedEntitlements.value;
        }

        throw await buildErrorMessage(response, "Billing status could not be verified.");
    }

    const data = await response.json();
    const entitlements = (data?.entitlements as VerifiedEntitlements | undefined) ?? getFreeEntitlements();
    cachedEntitlements = {
        sessionKey,
        fetchedAt: Date.now(),
        value: entitlements,
    };
    return entitlements;
}

export async function createCheckoutSession(
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle },
    accessToken?: string | null,
): Promise<{ authorizationUrl: string; reference: string }> {
    const authHeaders = await buildAuthHeaders(accessToken);
    const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: JSON.stringify(input),
    });

    if (response.status === 401) {
        throw new Error("Sign-in is required before starting paid checkout.");
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

export async function createInlinePurchaseIntent(
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle; email: string; referralCode?: string | null },
): Promise<{ reference: string; accessCode: string; amountCents: number }> {
    const response = await fetch("/api/billing/purchase/intent", {
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
        accessCode: data.accessCode as string,
        amountCents: data.amountCents as number,
    };
}

export async function fetchBillingAccount(accessToken?: string | null): Promise<BillingAccountPayload | null> {
    const authHeaders = await buildAuthHeaders(accessToken);
    const response = await fetch("/api/billing/account", {
        method: "GET",
        headers: authHeaders,
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

export async function confirmBillingTransaction(reference: string, accessToken?: string | null): Promise<BillingAccountPayload> {
    const authHeaders = await buildAuthHeaders(accessToken);
    const response = await fetch("/api/billing/confirm", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: JSON.stringify({ reference }),
        cache: "no-store",
    });

    if (response.status === 401) {
        throw new Error("Sign-in is required before confirming payment.");
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

export async function cancelSubscriptionRenewal(accessToken?: string | null): Promise<BillingAccountPayload> {
    const authHeaders = await buildAuthHeaders(accessToken);
    const response = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: authHeaders,
    });

    if (response.status === 401) {
        throw new Error("Sign-in is required before canceling renewal.");
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

export async function clearBillingError(accessToken?: string | null): Promise<void> {
    const authHeaders = await buildAuthHeaders(accessToken);
    const response = await fetch("/api/billing/clear-error", {
        method: "POST",
        headers: authHeaders,
    });

    if (!response.ok) {
        // Best-effort: ignore failures so retry can still proceed.
    }
}

export async function confirmGuestBillingTransaction(reference: string): Promise<{ paid: boolean; email: string; planId?: string }> {
    const response = await fetch("/api/billing/guest-confirm", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference }),
        cache: "no-store",
    });

    if (!response.ok) {
        throw await buildErrorMessage(response, "Payment verification could not be completed.");
    }

    return await response.json();
}
