import { PayslipInput } from "./schema";
import { roundTo } from "./money";
import { LEGAL_REGISTRY, getNMWForDate } from "./legal/registry";

/**
 * Returns the National Minimum Wage applicable for a specific date (defaults to now).
 */
export function getNMW(date: Date = new Date()): number {
    return getNMWForDate(date);
}

export const NMW_RATE = getNMW();

export const UIF_MONTHLY_CAP = LEGAL_REGISTRY.UIF.MONTHLY_CAP;
export const ACCOMMODATION_MAX_PCT = LEGAL_REGISTRY.SD7.ACCOMMODATION_MAX_PCT;
export const UIF_RATE = LEGAL_REGISTRY.UIF.RATE;
export const UIF_THRESHOLD_HOURS = LEGAL_REGISTRY.UIF.THRESHOLD_HOURS;
const OVERTIME_MULTIPLIER = LEGAL_REGISTRY.SD7.OVERTIME_MULTIPLIER;
const SUNDAY_PH_MULTIPLIER = LEGAL_REGISTRY.SD7.SUNDAY_PH_MULTIPLIER;
const SUNDAY_NON_ORDINARY_MULTIPLIER = LEGAL_REGISTRY.SD7.SUNDAY_NON_ORDINARY_MULTIPLIER;
const SUNDAY_ORDINARY_MULTIPLIER = LEGAL_REGISTRY.SD7.SUNDAY_ORDINARY_MULTIPLIER;
const MINIMUM_DAILY_HOURS_PAID = LEGAL_REGISTRY.SD7.MINIMUM_DAILY_HOURS_PAID;
const ANNUAL_LEAVE_ACCRUAL_RATE = LEGAL_REGISTRY.SD7.ANNUAL_LEAVE_ACCRUAL_RATE;

export interface PayBreakdown {
    ordinaryPay: number;
    effectiveOrdinaryHours: number;
    hourlyRate: number;
    overtimePay: number;
    sundayPay: number;
    publicHolidayPay: number;
    grossPay: number;
    totalHours: number;
    deductions: {
        uifEmployee: number;
        accommodation: number | undefined;
        shortfall?: number;
        advance?: number;
        other: number;
        total: number;
    };
    employerContributions: {
        uifEmployer: number;
        sdlEmployer: number;
    };
    netPay: number;
    periodStart?: Date;
    periodEnd?: Date;
    complianceWarnings: string[];
    leaveAccruedDays: number;
    leaveTaken: {
        annual: number;
        sick: number;
        family: number;
    };
}

function getPeriodWeeks(input: PayslipInput): number {
    const start = new Date(input.payPeriodStart);
    const end = new Date(input.payPeriodEnd);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
    return Math.max(1, diffDays / 7);
}

export function calculatePayslip(input: PayslipInput): PayBreakdown {
    const referenceDate = input.payPeriodEnd ? new Date(input.payPeriodEnd) : new Date();
    const activeNmwRate = getNMWForDate(referenceDate);
    const rate = Math.max(input.hourlyRate, activeNmwRate);

    const minimumRequiredHours = (input.daysWorked || 0) * MINIMUM_DAILY_HOURS_PAID;
    const enteredWorkedHours = input.ordinaryHours + input.overtimeHours + input.sundayHours + input.publicHolidayHours;
    const payableMinimumHours = enteredWorkedHours > 0 ? Math.max(minimumRequiredHours, input.ordinaryHours + (input.shortFallHours ?? 0)) : 0;
    const effectiveOrdinaryHours = Math.max(input.ordinaryHours + (input.shortFallHours ?? 0), payableMinimumHours - input.overtimeHours - input.sundayHours - input.publicHolidayHours, 0);

    const ordinaryPay = roundTo(effectiveOrdinaryHours * rate);
    const overtimePay = roundTo(input.overtimeHours * rate * OVERTIME_MULTIPLIER);

    const sundayMultiplier = input.ordinarilyWorksSundays ? SUNDAY_ORDINARY_MULTIPLIER : SUNDAY_NON_ORDINARY_MULTIPLIER;
    let sundayPay = 0;
    if (input.sundayHours > 0) {
        sundayPay = input.sundayHours * rate * sundayMultiplier;
        // BCEA/SD7 rule: minimum pay for Sunday is one day's ordinary wage
        const ordinaryDailyWage = (input.ordinaryHoursPerDay ?? 8) * rate;
        if (sundayPay < ordinaryDailyWage) {
            sundayPay = ordinaryDailyWage;
        }
    }
    sundayPay = roundTo(sundayPay);

    const publicHolidayPay = roundTo(input.publicHolidayHours * rate * SUNDAY_PH_MULTIPLIER);
    const grossPay = roundTo(ordinaryPay + overtimePay + sundayPay + publicHolidayPay);
    const totalHours = effectiveOrdinaryHours + input.overtimeHours + input.sundayHours + input.publicHolidayHours;

    const weeksInPeriod = getPeriodWeeks(input);
    const uifBase = Math.min(grossPay, UIF_MONTHLY_CAP);
    // UIF threshold is 24h per month. Scale it by weeks in period.
    const periodUifThreshold = (UIF_THRESHOLD_HOURS / 4.33) * weeksInPeriod;
    const uifContribution = totalHours > periodUifThreshold ? roundTo(uifBase * UIF_RATE) : 0;

    const sdlEmployer = 0;
    const accommodationLimit = roundTo(grossPay * ACCOMMODATION_MAX_PCT);
    const accommodation = input.includeAccommodation ? roundTo(Math.min(input.accommodationCost ?? accommodationLimit, accommodationLimit)) : undefined;
    const otherDeductions = roundTo(input.otherDeductions ?? 0);
    const totalDeductions = roundTo(uifContribution + (accommodation ?? 0) + otherDeductions);
    const netPay = Math.max(0, roundTo(grossPay - totalDeductions));

    const complianceWarnings: string[] = [];
    if (input.hourlyRate < activeNmwRate) {
        complianceWarnings.push(`Hourly rate (R${input.hourlyRate}) is below the statutory NMW for this period (R${activeNmwRate}).`);
    }

    if (input.ordinaryHours > 45 * weeksInPeriod) {
        complianceWarnings.push("Ordinary hours exceed the BCEA guideline of 45 hours per week for this period.");
    }
    if (input.overtimeHours > 10 * weeksInPeriod) {
        complianceWarnings.push("Overtime exceeds the BCEA guideline of 10 hours per week for this period.");
    }

    // SD7: 1 day for every 17 days worked
    const leaveAccruedDays = roundTo((input.daysWorked ?? 0) * ANNUAL_LEAVE_ACCRUAL_RATE, 2);

    return {
        ordinaryPay,
        effectiveOrdinaryHours,
        overtimePay,
        sundayPay,
        publicHolidayPay,
        grossPay,
        totalHours,
        hourlyRate: rate,
        deductions: {
            uifEmployee: uifContribution,
            accommodation,
            shortfall: roundTo((input.shortFallHours ?? 0) * rate),
            advance: roundTo(input.advanceAmount ?? 0),
            other: otherDeductions,
            total: roundTo(uifContribution + (accommodation ?? 0) + roundTo((input.shortFallHours ?? 0) * rate) + roundTo(input.advanceAmount ?? 0) + otherDeductions),
        },
        employerContributions: {
            uifEmployer: uifContribution,
            sdlEmployer,
        },
        netPay,
        periodStart: new Date(input.payPeriodStart),
        periodEnd: new Date(input.payPeriodEnd),
        complianceWarnings,
        leaveAccruedDays,
        leaveTaken: {
            annual: input.annualLeaveTaken ?? 0,
            sick: input.sickLeaveTaken ?? 0,
            family: input.familyLeaveTaken ?? 0,
        }
    };
}
