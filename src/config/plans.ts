export type PlanId = "free" | "annual" | "lifetime";

export interface PlanConfig {
    id: PlanId;
    label: string;
    isDefault?: boolean;
    currency: "ZAR";
    billing: "free" | "annual" | "once_off";

    // Annual pricing
    annualPromoPrice?: number;
    annualRegularPrice?: number;
    promoRuleText?: string;

    // Lifetime pricing
    onceOffPrice?: number;

    // Limits
    maxActiveEmployees: number; // Infinity for unlimited
    archiveMonths: number;

    // Features
    driveSync: boolean;
    contractGenerator: boolean;
    ufilingExport: boolean;
    leaveLoanTracker: boolean;
    roePack: boolean;

    // Marketing bullets
    marketingBullets: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
    free: {
        id: "free",
        label: "Free Starter",
        currency: "ZAR",
        billing: "free",
        maxActiveEmployees: 1,
        archiveMonths: 3,
        driveSync: false,
        contractGenerator: false,
        ufilingExport: false,
        leaveLoanTracker: false,
        roePack: true, // Free users can SEE the numbers, just not download? No, user spec says Free can copy numbers.
        marketingBullets: [
            "1 active employee seat",
            "Basic payslip flow",
            "ROE copy-paste numbers"
        ]
    },
    annual: {
        id: "annual",
        label: "Annual Support",
        isDefault: true,
        currency: "ZAR",
        billing: "annual",
        annualPromoPrice: 99,
        annualRegularPrice: 149,
        promoRuleText: "Launch promo: R99/year for first 200",
        maxActiveEmployees: 3,
        archiveMonths: 12,
        driveSync: true,
        contractGenerator: true,
        ufilingExport: true,
        leaveLoanTracker: false,
        roePack: true,
        marketingBullets: [
            "Up to 3 active employee seats",
            "12-month archive window",
            "Google Drive sync",
            "Contract generator",
            "uFiling-ready export",
            "Annual COIDA ROE Pack"
        ]
    },
    lifetime: {
        id: "lifetime",
        label: "Pro Lifetime",
        currency: "ZAR",
        billing: "once_off",
        onceOffPrice: 299,
        maxActiveEmployees: Infinity,
        archiveMonths: 60,
        driveSync: true,
        contractGenerator: true,
        ufilingExport: true,
        leaveLoanTracker: true,
        roePack: true,
        marketingBullets: [
            "Unlimited employees",
            "5-year archive",
            "Continuous sync",
            "Leave + loan tracker",
            "Annual COIDA ROE Pack"
        ]
    }
} as const;

export const NEXT_PUBLIC_ANNUAL_PRICE_MODE = process.env.NEXT_PUBLIC_ANNUAL_PRICE_MODE === "regular" ? "regular" : "promo";

export function getAnnualPrice(): number {
    return NEXT_PUBLIC_ANNUAL_PRICE_MODE === "promo"
        ? (PLANS.annual.annualPromoPrice ?? 149)
        : (PLANS.annual.annualRegularPrice ?? 149);
}

export function annualPriceLabel(): string {
    return NEXT_PUBLIC_ANNUAL_PRICE_MODE === "promo"
        ? `R99/year (Launch promo for first 200)`
        : `R149/year`;
}

// Keep the old refund policy summary here if it's used elsewhere, or just export it
export const REFUND_POLICY_SUMMARY = `If you request a refund within 14 days of purchase, we’ll refund you in full. How to request: Use the in-app Support link or email support@lekkerledger.co.za with your purchase email + date.`;
