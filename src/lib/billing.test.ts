import { describe, expect, it } from "vitest";
import {
    canBeReferred,
    canStartTrial,
    entitlementsFromSubscription,
    sanitizeBillingStatus,
    type SubscriptionRecord,
} from "./billing";

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
        expect(sanitizeBillingStatus("trialing")).toBe("trialing");
        expect(sanitizeBillingStatus("active")).toBe("active");
        expect(sanitizeBillingStatus("something-else")).toBe("unknown");
        expect(sanitizeBillingStatus(null)).toBe("unknown");
    });

    it("allows a first-time free user to start a trial", () => {
        expect(canStartTrial(null)).toBe(true);
        expect(canStartTrial(createSubscription())).toBe(true);
    });

    it("blocks trial starts after prior trial or billing history", () => {
        expect(canStartTrial(createSubscription({ hasUsedTrial: true }))).toBe(false);
        expect(canStartTrial(createSubscription({ trialConsumedAt: Date.parse("2026-02-01T00:00:00Z") }))).toBe(false);
        expect(canStartTrial(createSubscription({ status: "trialing", trialEndsAt: Date.parse("2026-03-24T00:00:00Z"), currentPeriodEnd: Date.parse("2026-03-24T00:00:00Z") }))).toBe(false);
        expect(canStartTrial(createSubscription({ planId: "standard" }))).toBe(false);
        expect(canStartTrial(createSubscription({ paystackCustomerId: "CUS_123" }))).toBe(false);
        expect(canStartTrial(createSubscription({ paystackAuthorizationCode: "AUTH_123" }))).toBe(false);
    });

    it("only allows referrals for genuinely new billing accounts", () => {
        expect(canBeReferred(null)).toBe(true);
        expect(canBeReferred(createSubscription())).toBe(true);
        expect(canBeReferred(createSubscription({ hasUsedTrial: true }))).toBe(false);
        expect(canBeReferred(createSubscription({ trialConsumedAt: Date.parse("2026-02-01T00:00:00Z") }))).toBe(false);
        expect(canBeReferred(createSubscription({ planId: "pro" }))).toBe(false);
        expect(canBeReferred(createSubscription({ paystackSubscriptionCode: "SUB_123" }))).toBe(false);
        expect(canBeReferred(createSubscription({ paystackAuthorizationCode: "AUTH_123" }))).toBe(false);
    });

    it("returns active trial entitlements with trial and next-charge dates", () => {
        const trialEndsAt = Date.parse("2026-03-24T12:00:00Z");
        const nextChargeAt = Date.parse("2026-03-24T12:00:00Z");
        const entitlements = entitlementsFromSubscription(
            createSubscription({
                planId: "standard",
                status: "trialing",
                currentPeriodEnd: trialEndsAt,
                trialStartedAt: Date.parse("2026-03-10T12:00:00Z"),
                trialEndsAt,
                nextChargeAt,
                cancelAtPeriodEnd: false,
            }),
            Date.parse("2026-03-12T00:00:00Z"),
            { availableReferralMonths: 2, pendingReferralMonths: 1 },
        );

        expect(entitlements.planId).toBe("standard");
        expect(entitlements.status).toBe("trialing");
        expect(entitlements.isActive).toBe(true);
        expect(entitlements.trialEndsAt).toBe("2026-03-24T12:00:00.000Z");
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
});
