/**
 * Statutory constants and rates for South African Labor Law (BCEA / SD7).
 * Centralized here to avoid logic drift and ensure historical accuracy.
 */

export const LEGAL_REGISTRY = {
    NMW: [
        { effectiveDate: "2022-03-01", rate: 23.19 },
        { effectiveDate: "2023-03-01", rate: 25.42 },
        { effectiveDate: "2024-03-01", rate: 27.58 },
        { effectiveDate: "2025-03-01", rate: 28.79 },
        { effectiveDate: "2026-03-01", rate: 30.23 },
    ],
    UIF: {
        RATE: 0.01,
        MONTHLY_CAP: 17712,
        THRESHOLD_HOURS: 24, // No UIF if worker works <= 24 hours in a month
    },
    SD7: {
        ACCOMMODATION_MAX_PCT: 0.10, // Max deduction for accommodation
        OVERTIME_MULTIPLIER: 1.5,
        SUNDAY_PH_MULTIPLIER: 2.0,
        SUNDAY_ORDINARY_MULTIPLIER: 1.5, // If employee ordinarily works on Sundays
    },
    LEAVE: {
        ANNUAL_RATE: 1 / 17, // 1 day for every 17 days worked
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
