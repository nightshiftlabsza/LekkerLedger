export interface PlanConfig {
    id: string;
    name: string;
    description: string;
    price: string;
    isPaid: boolean;
    features: string[];
    hasDriveSync: boolean;
    refundWindowDays: number;
}

export const PRICING_PLANS = {
    free: {
        id: "free",
        name: "Standard",
        description: "Local-first payroll and compliance for one household.",
        price: "Free",
        isPaid: false,
        features: [
            "1 Active Employee Seat",
            "3 Months History Archive",
            "BCEA Aligned Calculations",
            "Easy Monthly Payslips",
        ],
        hasDriveSync: false,
        refundWindowDays: 0,
    },
    annual: {
        id: "annual",
        name: "Annual Support",
        description: "Cloud backup and priority legal compliance updates.",
        price: "R 99 / year",
        isPaid: true,
        features: [
            "Up to 3 Employee Seats",
            "1 Year Compliance Archive",
            "Repeat Last Month Payroll",
            "BCEA Contract Generator",
        ],
        hasDriveSync: true,
        refundWindowDays: 14,
    },
    pro: {
        id: "pro",
        name: "Lekker Pro",
        description: "The complete payroll vault. Pay once, keep forever.",
        price: "R 299 once-off",
        isPaid: true,
        features: [
            "Unlimited Employee Seats",
            "5 Year Archive",
            "Private Google Drive Sync",
            "1-Click Monthly Payroll",
            "Full Document Vault",
        ],
        hasDriveSync: true,
        refundWindowDays: 14,
    },
    trial: {
        id: "trial",
        name: "Lekker Pro (Trial)",
        description: "Experience Pro Risk-Free for 30 days.",
        price: "Free Trial",
        isPaid: true, // Acts as paid
        features: [
            "Experience Pro Risk-Free"
        ],
        hasDriveSync: true,
        refundWindowDays: 0,
    }
} as const;

export type PlanKey = keyof typeof PRICING_PLANS;
export const REFUND_POLICY_SUMMARY = `If you request a refund within 14 days of purchase, we’ll refund you in full. How to request: Use the in-app Support link or email support@lekkerledger.co.za with your purchase email + date.`;
