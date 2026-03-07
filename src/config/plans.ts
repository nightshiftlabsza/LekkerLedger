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
    leaveTracking: boolean;
    documentsHub: boolean;
    contractGenerator: boolean;
    ufilingExport: boolean;
    roeDownloads: boolean;
    multiHousehold: boolean;
    description: string;
    bestFor: string;
    marketingBullets: string[];
}

export interface PlanPricePresentation {
    primaryPrice: string;
    periodLabel: string;
    helperText: string;
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
        leaveTracking: false,
        documentsHub: false,
        contractGenerator: false,
        ufilingExport: false,
        roeDownloads: false,
        multiHousehold: false,
        description: "Basic payslips for one worker, with no monthly or yearly billing.",
        bestFor: "Basic payslips for one worker.",
        marketingBullets: [
            "1 active employee",
            "1 household workspace",
            "Monthly payroll and payslip flow",
            "Stored on this device",
        ],
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
        leaveTracking: true,
        documentsHub: true,
        contractGenerator: true,
        ufilingExport: true,
        roeDownloads: true,
        multiHousehold: false,
        description: "Proper records for most households, with paperwork, backup, and room for up to 3 employees.",
        bestFor: "For most households.",
        marketingBullets: [
            "Up to 3 active employees",
            "Leave tracking, contracts, and document hub",
            "Private Google Drive backup",
            "uFiling export and ROE downloads",
            "12-month archive",
        ],
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
        leaveTracking: true,
        documentsHub: true,
        contractGenerator: true,
        ufilingExport: true,
        roeDownloads: true,
        multiHousehold: true,
        description: "More headroom and control for larger households, multiple homes, and longer-running records.",
        bestFor: "For larger households or more control.",
        marketingBullets: [
            "Unlimited employees",
            "Multi-household workspace",
            "5-year archive",
            "Everything in Standard",
        ],
    },
} as const;

export function getPlanPrice(plan: PlanId | PlanConfig, cycle: BillingCycle): number | null {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;
    return resolvedPlan.pricing[cycle] ?? null;
}

export function getPlanPricePresentation(plan: PlanId | PlanConfig, cycle: BillingCycle): PlanPricePresentation {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;

    if (!resolvedPlan.pricing.monthly || !resolvedPlan.pricing.yearly) {
        return {
            primaryPrice: "Free",
            periodLabel: "",
            helperText: "No monthly or yearly billing",
        };
    }

    if (cycle === "yearly") {
        return {
            primaryPrice: `≈ R${(resolvedPlan.pricing.yearly / 12).toFixed(2)}`,
            periodLabel: "/month",
            helperText: `Billed yearly at R${resolvedPlan.pricing.yearly}/year`,
        };
    }

    return {
        primaryPrice: `R${resolvedPlan.pricing.monthly}`,
        periodLabel: "/month",
        helperText: `Billed yearly at R${resolvedPlan.pricing.yearly}/year`,
    };
}


export const REFUND_POLICY_SUMMARY = `If you request a refund within 14 days of purchase, we'll refund you in full. Use the in-app Support link or email support@lekkerledger.co.za with your purchase email and date.`;


