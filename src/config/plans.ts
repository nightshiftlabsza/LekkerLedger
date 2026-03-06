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
        description: "Core payslips and household payroll records for one employer and one active employee.",
        bestFor: "One household with one employee.",
        marketingBullets: [
            "1 active employee",
            "1 household workspace",
            "3-month archive",
            "Core payslip flow",
            "ROE copy-ready numbers"
        ]
    },
    standard: {
        id: "standard",
        label: "Standard",
        shortLabel: "Standard",
        badge: "Popular",
        currency: "ZAR",
        pricing: {
            monthly: 29,
            yearly: 199,
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
        description: "For households managing a small team and wanting proper backups, exports, and annual paperwork.",
        bestFor: "One household with up to 3 active employees.",
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
        badge: "Best value",
        currency: "ZAR",
        pricing: {
            monthly: 39,
            yearly: 299,
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
        description: "For bookkeepers, families, and employers running multiple households with unlimited staff records.",
        bestFor: "Multiple households and unlimited employees.",
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


