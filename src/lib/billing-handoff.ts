"use client";

const PENDING_BILLING_REFERENCE_KEY = "lekkerledger:pending-billing-reference";
const PENDING_BILLING_EMAIL_KEY = "lekkerledger:pending-billing-email";
const PENDING_BILLING_PLAN_KEY = "lekkerledger:pending-billing-plan";
const PENDING_BILLING_CYCLE_KEY = "lekkerledger:pending-billing-cycle";
const PENDING_BILLING_REFERRAL_KEY = "lekkerledger:pending-billing-referral";

function readValue(key: string) {
    if (typeof globalThis.window === "undefined") return "";
    return globalThis.localStorage.getItem(key)?.trim() || "";
}

function writeValue(key: string, value: string) {
    if (typeof globalThis.window === "undefined") return;
    const trimmed = value.trim();
    if (!trimmed) {
        globalThis.localStorage.removeItem(key);
        return;
    }
    globalThis.localStorage.setItem(key, trimmed);
}

export function readPendingBillingReference() {
    return readValue(PENDING_BILLING_REFERENCE_KEY);
}

export function writePendingBillingReference(reference: string) {
    writeValue(PENDING_BILLING_REFERENCE_KEY, reference);
}

export function readPendingBillingEmail() {
    return readValue(PENDING_BILLING_EMAIL_KEY);
}

export function writePendingBillingEmail(email: string) {
    writeValue(PENDING_BILLING_EMAIL_KEY, email);
}

export interface PendingBillingCheckoutState {
    planId: "standard" | "pro";
    billingCycle: "monthly" | "yearly";
    email: string;
    referralCode?: string | null;
    reference?: string | null;
}

export function readPendingBillingCheckoutState(): PendingBillingCheckoutState | null {
    const planId = readValue(PENDING_BILLING_PLAN_KEY);
    const billingCycle = readValue(PENDING_BILLING_CYCLE_KEY);
    const email = readPendingBillingEmail();

    if ((planId !== "standard" && planId !== "pro") || (billingCycle !== "monthly" && billingCycle !== "yearly") || !email) {
        return null;
    }

    return {
        planId,
        billingCycle,
        email,
        referralCode: readValue(PENDING_BILLING_REFERRAL_KEY) || null,
        reference: readPendingBillingReference() || null,
    };
}

export function writePendingBillingCheckoutState(input: PendingBillingCheckoutState) {
    writeValue(PENDING_BILLING_PLAN_KEY, input.planId);
    writeValue(PENDING_BILLING_CYCLE_KEY, input.billingCycle);
    writePendingBillingEmail(input.email);
    writePendingBillingReference(input.reference ?? "");
    writeValue(PENDING_BILLING_REFERRAL_KEY, input.referralCode ?? "");
}

export function clearPendingBillingHandoff() {
    writeValue(PENDING_BILLING_REFERENCE_KEY, "");
    writeValue(PENDING_BILLING_EMAIL_KEY, "");
    writeValue(PENDING_BILLING_PLAN_KEY, "");
    writeValue(PENDING_BILLING_CYCLE_KEY, "");
    writeValue(PENDING_BILLING_REFERRAL_KEY, "");
}
