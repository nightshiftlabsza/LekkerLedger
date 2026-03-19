import type { BillingCycle, PlanId } from "./plans";

export type PaidPlanKey =
    | "STANDARD_MONTHLY"
    | "STANDARD_YEARLY"
    | "PRO_MONTHLY"
    | "PRO_YEARLY";

export interface BillingCatalogEntry {
    key: PaidPlanKey;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    interval: "monthly" | "annually";
    currency: "ZAR";
    amountCents: number;
    envVarName: string;
    customerLabel: string;
}

export const BILLING_CATALOG: Record<PaidPlanKey, BillingCatalogEntry> = {
    STANDARD_MONTHLY: {
        key: "STANDARD_MONTHLY",
        planId: "standard",
        billingCycle: "monthly",
        interval: "monthly",
        currency: "ZAR",
        amountCents: 2900,
        envVarName: "PAYSTACK_PLAN_STANDARD_MONTHLY",
        customerLabel: "Standard monthly",
    },
    STANDARD_YEARLY: {
        key: "STANDARD_YEARLY",
        planId: "standard",
        billingCycle: "yearly",
        interval: "annually",
        currency: "ZAR",
        amountCents: 29900,
        envVarName: "PAYSTACK_PLAN_STANDARD_YEARLY",
        customerLabel: "Standard yearly",
    },
    PRO_MONTHLY: {
        key: "PRO_MONTHLY",
        planId: "pro",
        billingCycle: "monthly",
        interval: "monthly",
        currency: "ZAR",
        amountCents: 4900,
        envVarName: "PAYSTACK_PLAN_PRO_MONTHLY",
        customerLabel: "Pro monthly",
    },
    PRO_YEARLY: {
        key: "PRO_YEARLY",
        planId: "pro",
        billingCycle: "yearly",
        interval: "annually",
        currency: "ZAR",
        amountCents: 39900,
        envVarName: "PAYSTACK_PLAN_PRO_YEARLY",
        customerLabel: "Pro yearly",
    },
} as const;

export const BILLING_CATALOG_KEYS = Object.keys(BILLING_CATALOG) as PaidPlanKey[];

export function getBillingCatalogEntry(planId: Exclude<PlanId, "free">, billingCycle: BillingCycle): BillingCatalogEntry {
    const entry = BILLING_CATALOG_KEYS
        .map((key) => BILLING_CATALOG[key])
        .find((candidate) => candidate.planId === planId && candidate.billingCycle === billingCycle);

    if (!entry) {
        throw new Error(`Unknown paid billing catalog entry for ${planId} ${billingCycle}.`);
    }

    return entry;
}

export function getBillingCatalogEntryByKey(key: PaidPlanKey): BillingCatalogEntry {
    return BILLING_CATALOG[key];
}

export function findBillingCatalogKey(planId: Exclude<PlanId, "free">, billingCycle: BillingCycle): PaidPlanKey {
    return getBillingCatalogEntry(planId, billingCycle).key;
}

export function getYearlySavingsPercent(planId: Exclude<PlanId, "free">): number {
    const monthlyEntry = getBillingCatalogEntry(planId, "monthly");
    const yearlyEntry = getBillingCatalogEntry(planId, "yearly");
    return Math.round((1 - (yearlyEntry.amountCents / (monthlyEntry.amountCents * 12))) * 100);
}
