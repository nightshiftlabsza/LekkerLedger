export type PlanId = "free" | "standard" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface PlanConfig {
    id: PlanId;
    label: string;
    shortLabel: string;
    badge?: string;
    currency: "ZAR";
    pricing: {
        monthly?: number;
        yearly?: number;
    };
    maxActiveEmployees: number;
    maxHouseholds: number;
    archiveMonths: number;
    driveSync: boolean;
    contractGenerator: boolean;
    ufilingExport: boolean;
    leaveLoanTracker: boolean;
    roePack: boolean;
    multiHousehold: boolean;
    description: string;
    bestFor: string;
    marketingBullets: string[];
}

export interface PlanSavings {
    yearlyEquivalent: number;
    yearlyPrice: number;
    amount: number;
    percent: number;
}

export const PLAN_ORDER: PlanId[] = ["free", "standard", "pro"];

export const PLANS: Record<PlanId, PlanConfig> = {
    free: {
        id: "free",
        label: "Free",
        shortLabel: "Free",
        currency: "ZAR",
        pricing: {},
        maxActiveEmployees: 1,
        maxHouseholds: 1,
        archiveMonths: 3,
        driveSync: false,
        contractGenerator: false,
        ufilingExport: false,
        leaveLoanTracker: false,
        roePack: true,
        multiHousehold: false,
        description: "A calm starting point for one household paying one employee correctly and keeping the basics tidy.",
        bestFor: "Try LekkerLedger with one employee.",
        marketingBullets: [
            "1 active employee",
            "1 household workspace",
            "3-month archive",
            "Clear payslip flow",
            "ROE copy-ready numbers"
        ]
    },
    standard: {
        id: "standard",
        label: "Standard",
        shortLabel: "Standard",
        badge: "Most popular",
        currency: "ZAR",
        pricing: {
            monthly: 29,
            yearly: 249,
        },
        maxActiveEmployees: 3,
        maxHouseholds: 1,
        archiveMonths: 12,
        driveSync: true,
        contractGenerator: true,
        ufilingExport: true,
        leaveLoanTracker: false,
        roePack: true,
        multiHousehold: false,
        description: "For most households that want backup, document exports, and annual paperwork handled cleanly.",
        bestFor: "For most households with up to 3 employees.",
        marketingBullets: [
            "Up to 3 active employees",
            "1 household workspace",
            "12-month archive",
            "Google Drive backup",
            "Contracts and uFiling export",
            "Annual COIDA ROE pack"
        ]
    },
    pro: {
        id: "pro",
        label: "Pro",
        shortLabel: "Pro",
        badge: "Deeper control",
        currency: "ZAR",
        pricing: {
            monthly: 49,
            yearly: 399,
        },
        maxActiveEmployees: Number.POSITIVE_INFINITY,
        maxHouseholds: Number.POSITIVE_INFINITY,
        archiveMonths: 60,
        driveSync: true,
        contractGenerator: true,
        ufilingExport: true,
        leaveLoanTracker: true,
        roePack: true,
        multiHousehold: true,
        description: "For larger households, multiple homes, or anyone who wants deeper record history and admin control.",
        bestFor: "For larger households or deeper control.",
        marketingBullets: [
            "Unlimited employees",
            "Multi-household workspace",
            "5-year archive",
            "Google Drive backup",
            "Leave and loan tracking",
            "Contracts, uFiling export, and ROE pack"
        ]
    },
} as const;

export function getPlanPrice(plan: PlanId | PlanConfig, cycle: BillingCycle): number | null {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;
    return resolvedPlan.pricing[cycle] ?? null;
}

export function getPlanDisplayPrice(plan: PlanId | PlanConfig, cycle: BillingCycle): string {
    const price = getPlanPrice(plan, cycle);
    if (price === null) return "Free";
    return `R${price}`;
}

export function getPlanSavings(plan: PlanId | PlanConfig): PlanSavings | null {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;
    if (!resolvedPlan.pricing.monthly || !resolvedPlan.pricing.yearly) return null;

    const yearlyEquivalent = resolvedPlan.pricing.monthly * 12;
    const yearlyPrice = resolvedPlan.pricing.yearly;
    const amount = yearlyEquivalent - yearlyPrice;

    if (amount <= 0) return null;

    return {
        yearlyEquivalent,
        yearlyPrice,
        amount,
        percent: Math.round((amount / yearlyEquivalent) * 100),
    };
}

export function getPlanPeriodLabel(plan: PlanId | PlanConfig, cycle: BillingCycle): string {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;
    if (!resolvedPlan.pricing[cycle]) return "forever";
    return cycle === "monthly" ? "/month" : "/year";
}

export function getPlanSavingsLabel(plan: PlanId | PlanConfig): string {
    const savings = getPlanSavings(plan);
    if (!savings) return "";
    return `Save ${savings.percent}% yearly`;
}

export const REFUND_POLICY_SUMMARY = `If you request a refund within 14 days of purchase, we'll refund you in full. Use the in-app Support link or email support@lekkerledger.co.za with your purchase email and date.`;


