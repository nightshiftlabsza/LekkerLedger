import { BillingCycle, PlanId } from "../config/plans";

export type BillingStatus = "free" | "active" | "past_due" | "canceled" | "refunded" | "unknown";

export interface SubscriptionRecord {
    userId: string;
    email: string;
    paystackCustomerId?: string | null;
    paystackSubscriptionCode?: string | null;
    paystackPlanCode?: string | null;
    planId: PlanId;
    billingCycle: BillingCycle;
    status: BillingStatus;
    currentPeriodEnd: number;
    updatedAt: number;
}

export interface VerifiedEntitlements {
    userId?: string;
    email?: string;
    planId: PlanId;
    billingCycle: BillingCycle;
    status: BillingStatus;
    paidUntil?: string;
    isActive: boolean;
}

export function sanitizePlanId(value: string | undefined | null): PlanId {
    if (value === "standard" || value === "pro") return value;
    return "free";
}

export function sanitizeBillingCycle(value: string | undefined | null): BillingCycle {
    return value === "monthly" ? "monthly" : "yearly";
}

export function isPaidPlanId(planId: PlanId): boolean {
    return planId === "standard" || planId === "pro";
}

export function addBillingInterval(date: Date, billingCycle: BillingCycle): Date {
    const next = new Date(date);
    if (billingCycle === "monthly") {
        next.setMonth(next.getMonth() + 1);
        return next;
    }

    next.setFullYear(next.getFullYear() + 1);
    return next;
}

export function getFreeEntitlements(): VerifiedEntitlements {
    return {
        planId: "free",
        billingCycle: "yearly",
        status: "free",
        isActive: false,
    };
}

export function isSubscriptionActive(status: BillingStatus, currentPeriodEnd: number, now = Date.now()): boolean {
    if (!currentPeriodEnd || currentPeriodEnd <= now) return false;
    return status !== "refunded";
}

export function entitlementsFromSubscription(record: SubscriptionRecord | null, now = Date.now()): VerifiedEntitlements {
    if (!record) return getFreeEntitlements();

    const isActive = isSubscriptionActive(record.status, record.currentPeriodEnd, now);
    return {
        userId: record.userId,
        email: record.email,
        planId: isActive ? sanitizePlanId(record.planId) : "free",
        billingCycle: record.billingCycle,
        status: record.status,
        paidUntil: record.currentPeriodEnd ? new Date(record.currentPeriodEnd).toISOString() : undefined,
        isActive,
    };
}
