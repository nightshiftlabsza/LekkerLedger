/**
 * Single source of truth for LekkerLedger pricing and feature entitlements.
 */

export const PRICING_PLANS = {
    free: {
        name: "Standard",
        driveSyncAllowed: false,
        refundWindowDays: 0,
    },
    annual: {
        name: "Annual Support",
        driveSyncAllowed: true,
        refundWindowDays: 14,
    },
    pro: {
        name: "Lekker Pro",
        driveSyncAllowed: true,
        refundWindowDays: 14,
    },
    trial: {
        name: "Lekker Pro (Trial)",
        driveSyncAllowed: true,
        refundWindowDays: 0,
    }
} as const;

export type PlanKey = keyof typeof PRICING_PLANS;
