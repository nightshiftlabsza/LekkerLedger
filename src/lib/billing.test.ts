import { describe, expect, it } from "vitest";
import {
    canAttachReferralToAccount,
    entitlementsFromSubscription,
    sanitizeBillingStatus,
    type SubscriptionRecord,
} from "./billing";
import { paymentBelongsToDifferentAccount } from "./billing-server";

function createSubscription(overrides: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
    return {
        userId: "user-1",
        email: "person@example.com",
        planId: "free",
        billingCycle: "monthly",
        status: "free",
        currentPeriodEnd: 0,
        updatedAt: Date.parse("2026-03-10T09:00:00Z"),
        ...overrides,
    };
}

describe("billing helpers", () => {
    it("sanitizes billing status values safely", () => {
        expect(sanitizeBillingStatus("trialing")).toBe("unknown");
        expect(sanitizeBillingStatus("active")).toBe("active");
        expect(sanitizeBillingStatus("something-else")).toBe("unknown");
        expect(sanitizeBillingStatus(null)).toBe("unknown");
    });

    it("allows referral attachment for genuinely new free accounts", () => {
        expect(canAttachReferralToAccount(null)).toBe(true);
        expect(canAttachReferralToAccount(createSubscription())).toBe(true);
    });

    it("blocks referral attachment after any real billing state exists", () => {
        expect(canAttachReferralToAccount(createSubscription({ status: "active", currentPeriodEnd: Date.parse("2026-03-24T00:00:00Z") } as Partial<SubscriptionRecord>))).toBe(false);
        expect(canAttachReferralToAccount(createSubscription({ planId: "standard" }))).toBe(false);
        expect(canAttachReferralToAccount(createSubscription({ paystackCustomerId: "CUS_123" }))).toBe(false);
        expect(canAttachReferralToAccount(createSubscription({ paystackAuthorizationCode: "AUTH_123" }))).toBe(false);
    });

    it("returns active entitlements with next-charge dates", () => {
        const nextChargeAt = Date.parse("2026-03-24T12:00:00Z");
        const entitlements = entitlementsFromSubscription(
            createSubscription({
                planId: "standard",
                status: "active",
                currentPeriodEnd: nextChargeAt,
                nextChargeAt,
                cancelAtPeriodEnd: false,
            }),
            Date.parse("2026-03-12T00:00:00Z"),
            { availableReferralMonths: 2, pendingReferralMonths: 1 },
        );

        expect(entitlements.planId).toBe("standard");
        expect(entitlements.status).toBe("active");
        expect(entitlements.isActive).toBe(true);
        expect(entitlements.nextChargeAt).toBe("2026-03-24T12:00:00.000Z");
        expect(entitlements.availableReferralMonths).toBe(2);
        expect(entitlements.pendingReferralMonths).toBe(1);
    });

    it("drops expired access back to free while keeping the billing status", () => {
        const entitlements = entitlementsFromSubscription(
            createSubscription({
                planId: "pro",
                status: "canceled",
                currentPeriodEnd: Date.parse("2026-03-01T00:00:00Z"),
                cancelAtPeriodEnd: true,
            }),
            Date.parse("2026-03-10T00:00:00Z"),
            { availableReferralMonths: 1, pendingReferralMonths: 0 },
        );

        expect(entitlements.planId).toBe("free");
        expect(entitlements.status).toBe("canceled");
        expect(entitlements.isActive).toBe(false);
        expect(entitlements.cancelAtPeriodEnd).toBe(true);
        expect(entitlements.availableReferralMonths).toBe(1);
    });

    it("lets a signed-in user claim a successful guest checkout", () => {
        expect(paymentBelongsToDifferentAccount({
            metadataUserId: "guest_123",
            intent: {
                id: "intent-1",
                reference: "purchase_ref",
                userId: "guest_123",
                email: "guest@example.com",
                planId: "standard",
                billingCycle: "monthly",
                amountCents: 9900,
                status: "payment_received",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            paymentEmail: "guest@example.com",
            user: {
                userId: "real-user",
                email: "guest@example.com",
            },
        })).toBe(false);
    });
});
