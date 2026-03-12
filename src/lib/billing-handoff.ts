"use client";

const PENDING_BILLING_REFERENCE_KEY = "lekkerledger:pending-billing-reference";
const PENDING_BILLING_EMAIL_KEY = "lekkerledger:pending-billing-email";

function readValue(key: string) {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(key)?.trim() || "";
}

function writeValue(key: string, value: string) {
    if (typeof window === "undefined") return;
    const trimmed = value.trim();
    if (!trimmed) {
        window.localStorage.removeItem(key);
        return;
    }
    window.localStorage.setItem(key, trimmed);
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

export function clearPendingBillingHandoff() {
    writeValue(PENDING_BILLING_REFERENCE_KEY, "");
    writeValue(PENDING_BILLING_EMAIL_KEY, "");
}
