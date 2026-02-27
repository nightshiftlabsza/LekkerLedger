/**
 * BCEA Leave Calculations for Domestic Workers (Sectoral Determination 7)
 *
 * Annual leave:  1 day for every 17 days worked, OR 15 working days per year
 * Sick leave:    30 days over a 36-month cycle (i.e. 10 days/year)
 * Family resp.:  3 days per year (for workers who've been employed > 4 months)
 */

import { LeaveRecord } from "./schema";

// ─── Constants ──────────────────────────────────────────────────────────

export const ANNUAL_LEAVE_DAYS_PER_YEAR = 15;
export const SICK_LEAVE_DAYS_PER_CYCLE = 30; // 36-month cycle
export const SICK_LEAVE_CYCLE_YEARS = 3;
export const FAMILY_LEAVE_DAYS_PER_YEAR = 3;

// ─── Helpers ────────────────────────────────────────────────────────────

function daysBetween(from: Date, to: Date): number {
    const diffMs = to.getTime() - from.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function monthsBetween(from: Date, to: Date): number {
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

// ─── Leave Balances ─────────────────────────────────────────────────────

export interface LeaveBalances {
    annual: { accrued: number; taken: number; remaining: number };
    sick: { accrued: number; taken: number; remaining: number };
    family: { accrued: number; taken: number; remaining: number };
}

/**
 * Calculate leave balances based on employment start date and leave records.
 * @param startDate - ISO date string when the worker started
 * @param leaveRecords - Array of leave records for this employee
 * @param asOfDate - Date to calculate balances as of (defaults to now)
 */
export function calculateLeaveBalances(
    startDate: string,
    leaveRecords: LeaveRecord[],
    asOfDate: Date = new Date()
): LeaveBalances {
    const start = new Date(startDate);
    if (isNaN(start.getTime()) || start > asOfDate) {
        // If invalid or future start date, return zeros
        return {
            annual: { accrued: 0, taken: 0, remaining: 0 },
            sick: { accrued: 0, taken: 0, remaining: 0 },
            family: { accrued: 0, taken: 0, remaining: 0 },
        };
    }

    const months = monthsBetween(start, asOfDate);
    const years = months / 12;
    const daysEmployed = daysBetween(start, asOfDate);

    // Annual leave: 1 day for every 17 days worked (BCEA)
    const annualAccrued = Math.floor(daysEmployed / 17);

    // Sick leave: 30 days per 36-month cycle
    const sickCycles = Math.min(years / SICK_LEAVE_CYCLE_YEARS, 1); // cap at 1 full cycle
    const sickAccrued = Math.floor(sickCycles * SICK_LEAVE_DAYS_PER_CYCLE * 10) / 10;

    // Family responsibility: 3 days per year (only after 4 months employment)
    const familyAccrued = daysEmployed > 120 ? Math.floor(years * FAMILY_LEAVE_DAYS_PER_YEAR * 10) / 10 : 0;

    // Sum taken days by type
    const taken = { annual: 0, sick: 0, family: 0 };
    for (const r of leaveRecords) {
        if (r.type === "annual") taken.annual += r.days;
        else if (r.type === "sick") taken.sick += r.days;
        else if (r.type === "family") taken.family += r.days;
    }

    return {
        annual: {
            accrued: annualAccrued,
            taken: taken.annual,
            remaining: Math.max(0, annualAccrued - taken.annual),
        },
        sick: {
            accrued: sickAccrued,
            taken: taken.sick,
            remaining: Math.max(0, sickAccrued - taken.sick),
        },
        family: {
            accrued: familyAccrued,
            taken: taken.family,
            remaining: Math.max(0, familyAccrued - taken.family),
        },
    };
}
