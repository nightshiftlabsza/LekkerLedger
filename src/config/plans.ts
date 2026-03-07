export type PlanId = "free" | "standard" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeatures {
    driveSync: boolean;
    leaveTracking: boolean;
    documentsHub: boolean;
    contractSignedCopyUpload: boolean;
    vaultUploads: boolean;
    autoBackup: boolean;
    yearEndSummary: boolean;
    fullHistoryExport: boolean;
    contractGenerator: boolean;
    ufilingExport: boolean;
    roeDownloads: boolean;
    multiHousehold: boolean;
}

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
    features: PlanFeatures;
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
        features: {
            driveSync: false,
            leaveTracking: false,
            documentsHub: true,
            contractSignedCopyUpload: false,
            vaultUploads: false,
            autoBackup: false,
            yearEndSummary: false,
            fullHistoryExport: false,
            contractGenerator: false,
            ufilingExport: false,
            roeDownloads: false,
            multiHousehold: false,
        },
        description: "Basic payslips for one worker, with no monthly or yearly billing.",
        bestFor: "Basic payslips for one worker.",
        marketingBullets: [
            "1 active employee",
            "1 household",
            "Monthly payroll and payslip flow",
            "Browse the latest 3 months of generated records",
            "Stored on this device",
        ],
    },
    standard: {
        id: "standard",
        label: "Standard",
        shortLabel: "Standard",
        currency: "ZAR",
        pricing: {
            monthly: 29,
            yearly: 249,
        },
        maxActiveEmployees: 3,
        maxHouseholds: 1,
        archiveMonths: 12,
        features: {
            driveSync: true,
            leaveTracking: true,
            documentsHub: true,
            contractSignedCopyUpload: true,
            vaultUploads: false,
            autoBackup: false,
            yearEndSummary: false,
            fullHistoryExport: false,
            contractGenerator: true,
            ufilingExport: true,
            roeDownloads: true,
            multiHousehold: false,
        },
        description: "Proper records for most households, with paperwork, backup, and room for up to 3 employees.",
        bestFor: "For most households.",
        marketingBullets: [
            "Up to 3 active employees",
            "Leave tracking, contracts, and document hub",
            "Upload signed copies for app-generated contracts",
            "Private Google Drive backup",
            "uFiling export and ROE downloads",
            "12-month archive",
        ],
    },
    pro: {
        id: "pro",
        label: "Pro",
        shortLabel: "Pro",
        currency: "ZAR",
        pricing: {
            monthly: 49,
            yearly: 399,
        },
        maxActiveEmployees: Number.POSITIVE_INFINITY,
        maxHouseholds: Number.POSITIVE_INFINITY,
        archiveMonths: 60,
        features: {
            driveSync: true,
            leaveTracking: true,
            documentsHub: true,
            contractSignedCopyUpload: true,
            vaultUploads: true,
            autoBackup: true,
            yearEndSummary: true,
            fullHistoryExport: true,
            contractGenerator: true,
            ufilingExport: true,
            roeDownloads: true,
            multiHousehold: true,
        },
        description: "More headroom and control for larger households, multiple homes, or helping manage records across more than one household.",
        bestFor: "For multiple households or more control.",
        marketingBullets: [
            "Unlimited employees",
            "Multiple households (for example: main home + holiday home)",
            "5-year archive",
            "Private document vault in your Google account",
            "Automatic backups and year-end summaries",
            "Everything in Standard",
        ],
    },
} as const;

export function getPlanPrice(plan: PlanId | PlanConfig, cycle: BillingCycle): number | null {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;
    return resolvedPlan.pricing[cycle] ?? null;
}

export function getPlanFeatures(plan: PlanId | PlanConfig): PlanFeatures {
    const resolvedPlan = typeof plan === "string" ? PLANS[plan] : plan;
    return resolvedPlan.features;
}

export function hasPlanFeature(plan: PlanId | PlanConfig, feature: keyof PlanFeatures): boolean {
    return getPlanFeatures(plan)[feature];
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


