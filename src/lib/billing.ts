import { BillingCycle, PlanId } from "../config/plans";

export type BillingStatus = "free" | "trialing" | "active" | "past_due" | "canceled" | "refunded" | "unknown";
export type BillingIntentStatus = "pending" | "checkout_started" | "trial_started" | "completed" | "rejected" | "canceled";
export type ReferralStatus = "trial_started" | "qualified_pending_reward" | "reward_granted" | "reversed" | "rejected";
export type BillingCreditStatus = "pending" | "available" | "applied" | "reversed";

export interface SubscriptionRecord {
    userId: string;
    email: string;
    paystackCustomerId?: string | null;
    paystackSubscriptionCode?: string | null;
    paystackPlanCode?: string | null;
    paystackEmailToken?: string | null;
    paystackAuthorizationCode?: string | null;
    paystackAuthorizationSignature?: string | null;
    paystackAuthorizationLast4?: string | null;
    planId: PlanId;
    billingCycle: BillingCycle;
    status: BillingStatus;
    currentPeriodEnd: number;
    nextChargeAt?: number | null;
    cancelAtPeriodEnd?: boolean;
    trialStartedAt?: number | null;
    trialEndsAt?: number | null;
    trialConsumedAt?: number | null;
    hasUsedTrial?: boolean;
    lastError?: string | null;
    updatedAt: number;
}

export interface BillingIntentRecord {
    id: string;
    reference: string;
    userId: string;
    email: string;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    referralCode?: string | null;
    amountCents: number;
    status: BillingIntentStatus;
    createdAt: number;
    updatedAt: number;
}

export interface ReferralCodeRecord {
    userId: string;
    code: string;
    createdAt: number;
}

export interface ReferralRecord {
    id: string;
    referrerUserId: string;
    refereeUserId: string;
    refereeEmail: string;
    referralCode: string;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    status: ReferralStatus;
    qualifiedAt?: number | null;
    pendingUntil?: number | null;
    createdAt: number;
    updatedAt: number;
}

export interface BillingCreditRecord {
    id: string;
    userId: string;
    referralId: string;
    months: number;
    status: BillingCreditStatus;
    availableAt?: number | null;
    appliedAt?: number | null;
    createdAt: number;
    updatedAt: number;
}

export interface BillingAccountSummary {
    referralCode?: string | null;
    trialEndsAt?: string;
    nextChargeAt?: string;
    cancelAtPeriodEnd: boolean;
    availableReferralMonths: number;
    pendingReferralMonths: number;
    successfulReferralCount: number;
    totalReferralMonthsEarned: number;
    lastError?: string;
}

export interface VerifiedEntitlements {
    userId?: string;
    email?: string;
    planId: PlanId;
    billingCycle: BillingCycle;
    status: BillingStatus;
    paidUntil?: string;
    trialEndsAt?: string;
    nextChargeAt?: string;
    cancelAtPeriodEnd: boolean;
    availableReferralMonths: number;
    pendingReferralMonths: number;
    lastError?: string;
    isActive: boolean;
}

export function sanitizePlanId(value: string | undefined | null): PlanId {
    if (value === "standard" || value === "pro") return value;
    return "free";
}

export function sanitizeBillingCycle(value: string | undefined | null): BillingCycle {
    return value === "monthly" ? "monthly" : "yearly";
}

export function sanitizeBillingStatus(value: string | undefined | null): BillingStatus {
    if (value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "refunded" || value === "free") {
        return value;
    }
    return "unknown";
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

export function addCalendarMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

export function getFreeEntitlements(): VerifiedEntitlements {
    return {
        planId: "free",
        billingCycle: "monthly",
        status: "free",
        cancelAtPeriodEnd: false,
        availableReferralMonths: 0,
        pendingReferralMonths: 0,
        isActive: false,
    };
}

export function isSubscriptionActive(status: BillingStatus, currentPeriodEnd: number, now = Date.now()): boolean {
    if (!currentPeriodEnd || currentPeriodEnd <= now) return false;
    return status !== "refunded" && status !== "free";
}

export function canStartTrial(record: SubscriptionRecord | null, now = Date.now()): boolean {
    if (!record) return true;
    if (record.hasUsedTrial) return false;
    if (record.trialConsumedAt) return false;
    if (record.status === "trialing") return false;
    if (record.planId !== "free") return false;
    if (record.paystackCustomerId || record.paystackSubscriptionCode || record.paystackAuthorizationCode) return false;
    return !isSubscriptionActive(record.status, record.currentPeriodEnd, now);
}

export function canBeReferred(record: SubscriptionRecord | null): boolean {
    if (!record) return true;
    return !record.hasUsedTrial
        && !record.trialConsumedAt
        && record.planId === "free"
        && !record.paystackCustomerId
        && !record.paystackSubscriptionCode
        && !record.paystackAuthorizationCode;
}

export function getAccessEndTimestamp(record: Pick<SubscriptionRecord, "currentPeriodEnd"> | null | undefined): number {
    return record?.currentPeriodEnd || 0;
}

export function entitlementsFromSubscription(
    record: SubscriptionRecord | null,
    now = Date.now(),
    summary?: Partial<BillingAccountSummary>,
): VerifiedEntitlements {
    if (!record) {
        return {
            ...getFreeEntitlements(),
            availableReferralMonths: summary?.availableReferralMonths ?? 0,
            pendingReferralMonths: summary?.pendingReferralMonths ?? 0,
        };
    }

    const isActive = isSubscriptionActive(record.status, record.currentPeriodEnd, now);
    return {
        userId: record.userId,
        email: record.email,
        planId: isActive ? sanitizePlanId(record.planId) : "free",
        billingCycle: record.billingCycle,
        status: record.status,
        paidUntil: record.currentPeriodEnd ? new Date(record.currentPeriodEnd).toISOString() : undefined,
        trialEndsAt: record.trialEndsAt ? new Date(record.trialEndsAt).toISOString() : undefined,
        nextChargeAt: (record.nextChargeAt ?? record.currentPeriodEnd) ? new Date(record.nextChargeAt ?? record.currentPeriodEnd).toISOString() : undefined,
        cancelAtPeriodEnd: Boolean(record.cancelAtPeriodEnd),
        availableReferralMonths: summary?.availableReferralMonths ?? 0,
        pendingReferralMonths: summary?.pendingReferralMonths ?? 0,
        lastError: record.lastError || undefined,
        isActive,
    };
}
