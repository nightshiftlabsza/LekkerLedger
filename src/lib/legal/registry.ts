/**
 * Statutory constants and rates for South African Labor Law (BCEA / SD7).
 * Centralized here to avoid logic drift and ensure historical accuracy.
 *
 * MAINTENANCE REMINDER: NMW generally updates annually in March.
 * Check government gazettes annually and update COMPLIANCE.NMW.HISTORICAL.
 */

import { COMPLIANCE } from "../compliance-constants";

const SORTED_NMW = [...COMPLIANCE.NMW.HISTORICAL].sort((a, b) =>
    new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
);

export const LEGAL_REGISTRY = {
    NMW: SORTED_NMW,
    UIF: {
        RATE: COMPLIANCE.UIF.DEDUCTION_PERCENTAGE,
        MONTHLY_CAP: COMPLIANCE.UIF.MONTHLY_CAP,
        THRESHOLD_HOURS: COMPLIANCE.UIF.THRESHOLD_HOURS_PER_MONTH,
    },
    SD7: {
        ACCOMMODATION_MAX_PCT: COMPLIANCE.SD7.ACCOMMODATION_MAX_PCT,
        OVERTIME_MULTIPLIER: COMPLIANCE.OVERTIME.RATE_MULTIPLIER,
        SUNDAY_PH_MULTIPLIER: COMPLIANCE.PUBLIC_HOLIDAY_PAY.MULTIPLIER_IF_WORKED,
        SUNDAY_ORDINARY_MULTIPLIER: COMPLIANCE.SUNDAY_PAY.ORDINARILY_WORKS_MULTIPLIER,
        SUNDAY_NON_ORDINARY_MULTIPLIER: COMPLIANCE.SUNDAY_PAY.NORMAL_MULTIPLIER,
        MINIMUM_DAILY_HOURS_PAID: COMPLIANCE.MINIMUM_DAILY_PAY.MINIMUM_HOURS_PAID,
        ANNUAL_LEAVE_ACCRUAL_RATE: COMPLIANCE.LEAVE.RATE,
    },
    LEAVE: {
        ANNUAL_RATE: COMPLIANCE.LEAVE.RATE,
    }
};

export function getNMWRecordForDate(date: Date = new Date()) {
    const applicable = SORTED_NMW.find((rate) => date.getTime() >= new Date(rate.effectiveDate).getTime());
    const record = applicable ?? SORTED_NMW[SORTED_NMW.length - 1];

    return {
        ...record,
        sourceUrl: COMPLIANCE.NMW.SOURCE_URL,
    };
}

/**
 * Returns the National Minimum Wage applicable for a specific date.
 */
export function getNMWForDate(date: Date = new Date()): number {
    return getNMWRecordForDate(date).rate;
}
