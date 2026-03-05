/**
 * Statutory constants and rates for South African Labor Law (BCEA / SD7).
 * Centralized here to avoid logic drift and ensure historical accuracy.
 */

import { COMPLIANCE } from "../compliance-constants";

export const LEGAL_REGISTRY = {
    NMW: COMPLIANCE.NMW.HISTORICAL,
    UIF: {
        RATE: COMPLIANCE.UIF.DEDUCTION_PERCENTAGE,
        MONTHLY_CAP: COMPLIANCE.UIF.MONTHLY_CAP,
        THRESHOLD_HOURS: COMPLIANCE.UIF.THRESHOLD_HOURS_PER_MONTH, // No UIF if worker works <= 24 hours in a month
    },
    SD7: {
        ACCOMMODATION_MAX_PCT: COMPLIANCE.SD7.ACCOMMODATION_MAX_PCT, // Max deduction for accommodation
        OVERTIME_MULTIPLIER: COMPLIANCE.OVERTIME.RATE_MULTIPLIER,
        SUNDAY_PH_MULTIPLIER: COMPLIANCE.PUBLIC_HOLIDAY_PAY.MULTIPLIER_IF_WORKED,
        SUNDAY_ORDINARY_MULTIPLIER: COMPLIANCE.SUNDAY_PAY.ORDINARILY_WORKS_MULTIPLIER, // If employee ordinarily works on Sundays
    },
    LEAVE: {
        ANNUAL_RATE: COMPLIANCE.LEAVE.RATE, // 1 day for every 17 days worked
    }
};

/**
 * Returns the National Minimum Wage applicable for a specific date.
 */
export function getNMWForDate(date: Date = new Date()): number {
    const sorted = [...LEGAL_REGISTRY.NMW].sort((a, b) =>
        new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

    const applicable = sorted.find(r => date.getTime() >= new Date(r.effectiveDate).getTime());
    return applicable ? applicable.rate : sorted[sorted.length - 1].rate;
}
