export type PlanId = "free" | "standard" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeatures {
    encryptedSync: boolean;
    leaveTracking: boolean;
    documentsHub: boolean;
    contractSignedCopyUpload: boolean;
    vaultUploads: boolean;
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
            encryptedSync: false,
            leaveTracking: false,
            documentsHub: false,
            contractSignedCopyUpload: false,
            vaultUploads: false,

            yearEndSummary: false,
            fullHistoryExport: false,
            contractGenerator: false,
            ufilingExport: false,
            roeDownloads: false,
            multiHousehold: false,
        },
        description: "One worker. Quick monthly payslips. No sign-up needed.",
        bestFor: "Try it out, or keep it simple.",
        marketingBullets: [
            "1 active employee",
            "Monthly payslips — preview, download, share",
            "Household checklist and guides",
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
        features: {
            encryptedSync: true,
            leaveTracking: true,
            documentsHub: true,
            contractSignedCopyUpload: true,
            vaultUploads: false,

            yearEndSummary: false,
            fullHistoryExport: false,
            contractGenerator: true,
            ufilingExport: true,
            roeDownloads: true,
            multiHousehold: false,
        },
        description: "A domestic worker, nanny, and gardener — up to 3 workers with organised records and backup.",
        bestFor: "Do it properly.",
        marketingBullets: [
            "Up to 3 active employees",
            "Leave tracking — annual, sick & family responsibility",
            "Employment contract drafts",
            "Upload signed copies of your contracts",
            "Documents hub for payslips and contracts",
            "uFiling CSV export and ROE downloads",
            "Encrypted sync across devices",
            "12 months of browsable history",
        ],
    },
    pro: {
        id: "pro",
        label: "Pro",
        shortLabel: "Pro",
        badge: "Full control",
        currency: "ZAR",
        pricing: {
            monthly: 49,
            yearly: 399,
        },
        maxActiveEmployees: Number.POSITIVE_INFINITY,
        maxHouseholds: Number.POSITIVE_INFINITY,
        archiveMonths: 60,
        features: {
            encryptedSync: true,
            leaveTracking: true,
            documentsHub: true,
            contractSignedCopyUpload: true,
            vaultUploads: true,

            yearEndSummary: true,
            fullHistoryExport: true,
            contractGenerator: true,
            ufilingExport: true,
            roeDownloads: true,
            multiHousehold: true,
        },
        description: "Full document storage, year-end summaries, long-term history, and faster support. Also for multiple households.",
        bestFor: "Complete peace of mind.",
        marketingBullets: [
            "Unlimited employees",
            "Document vault — upload and store signed contracts, ID copies, anything",
            "Year-end employment summary PDF",
            "5 years of browsable, searchable history",
            "Automatic encrypted sync",
            "Faster support — reply within 1 business day",
            "Multiple households (main home + holiday home)",
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
            helperText: "No billing, no account required",
        };
    }

    if (resolvedPlan.id === "standard") {
        if (cycle === "yearly") {
            return {
                primaryPrice: "R20.75",
                periodLabel: "/month",
                helperText: "Billed at R249/year",
            };
        }

        return {
            primaryPrice: "R29",
            periodLabel: "/month",
            helperText: "Billed monthly",
        };
    }

    if (cycle === "yearly") {
        return {
            primaryPrice: "R33.25",
            periodLabel: "/month",
            helperText: "Billed at R399/year",
        };
    }

    return {
        primaryPrice: "R49",
        periodLabel: "/month",
        helperText: "Billed monthly",
    };
}


export const REFUND_POLICY_SUMMARY = `The 14-day refund window starts on your paid purchase date. Use the in-app Support link or email support@lekkerledger.co.za with your purchase email and date.`;


