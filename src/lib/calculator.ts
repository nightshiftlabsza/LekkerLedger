import { PayslipInput } from "./schema";
import { roundTo } from "./money";
import { LEGAL_REGISTRY, getNMWForDate } from "./legal/registry";

/**
 * Returns the National Minimum Wage applicable for a specific date (defaults to now).
 */
export function getNMW(date: Date = new Date()): number {
    return getNMWForDate(date);
}

// 100 FIXES: Export a default NMW_RATE for simple default assignments in forms
export const NMW_RATE = getNMW();


export const UIF_MONTHLY_CAP = LEGAL_REGISTRY.UIF.MONTHLY_CAP;
export const ACCOMMODATION_MAX_PCT = LEGAL_REGISTRY.SD7.ACCOMMODATION_MAX_PCT;
export const UIF_RATE = LEGAL_REGISTRY.UIF.RATE;
export const UIF_THRESHOLD_HOURS = LEGAL_REGISTRY.UIF.THRESHOLD_HOURS;
const OVERTIME_MULTIPLIER = LEGAL_REGISTRY.SD7.OVERTIME_MULTIPLIER;
const SUNDAY_PH_MULTIPLIER = LEGAL_REGISTRY.SD7.SUNDAY_PH_MULTIPLIER;

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
        other: number;
        total: number;
    };
    employerContributions: {
        uifEmployer: number;
        sdlEmployer: number;
    };
    netPay: number;
    complianceWarnings: string[];
    leaveAccruedDays: number;
    leaveTaken: {
        annual: number;
        sick: number;
        family: number;
    };
}

export function calculatePayslip(input: PayslipInput): PayBreakdown {
    // 100 FIXES: Use historical NMW rate based on the payslip date, not current system time.
    const referenceDate = input.payPeriodEnd ? new Date(input.payPeriodEnd) : new Date();
    const activeNmwRate = getNMWForDate(referenceDate);

    // Enforce NMW guardrail based on the historical rate
    const rate = Math.max(input.hourlyRate, activeNmwRate);

    // 4-hour shift rule: if total ordinary hours on specific days < 4, 
    // the calculation automatically tops up the pay.
    let effectiveOrdinaryHours = input.ordinaryHours + (input.shortFallHours ?? 0);
    const minimumRequiredHours = (input.daysWorked || 0) * 4;

    // Only apply the minimum shift rule if they actually worked
    if (effectiveOrdinaryHours > 0 && effectiveOrdinaryHours < minimumRequiredHours) {
        effectiveOrdinaryHours = minimumRequiredHours;
    }

    const ordinaryPay = effectiveOrdinaryHours * rate;
    const overtimePay = input.overtimeHours * rate * OVERTIME_MULTIPLIER;

    // BCEA Section 16: If they ordinarily work on a Sunday, it's 1.5x. Otherwise, 2.0x.
    const sundayMultiplier = input.ordinarilyWorksSundays ? 1.5 : 2.0;

    let sundayPay = 0;
    if (input.sundayHours > 0) {
        sundayPay = input.sundayHours * rate * sundayMultiplier;

        // BCEA Section 16(3): If they work less than their ordinary shift on a Sunday, 
        // Sunday pay cannot be less than their ordinary daily wage.
        const ordinaryDailyWage = (input.ordinaryHoursPerDay ?? 8) * rate;
        if (sundayPay < ordinaryDailyWage) {
            sundayPay = ordinaryDailyWage;
        }
    }

    const publicHolidayPay = input.publicHolidayHours * rate * SUNDAY_PH_MULTIPLIER;

    const grossPay = ordinaryPay + overtimePay + sundayPay + publicHolidayPay;

    const totalHours =
        effectiveOrdinaryHours + input.overtimeHours + input.sundayHours + input.publicHolidayHours;

    // UIF: only if > 24 hours this period
    const uifBase = Math.min(grossPay, UIF_MONTHLY_CAP);
    const uifEmployee = totalHours > UIF_THRESHOLD_HOURS ? uifBase * UIF_RATE : 0;
    const uifEmployer = totalHours > UIF_THRESHOLD_HOURS ? uifBase * UIF_RATE : 0;

    // SDL: Sectoral Determination 7 (Domestic Workers) technically exempts 
    // most employers. Skill Development Levy is required only for payrolls > R500k/year.

    const sdlEmployer = 0;

    // Accommodation: provided cost, strictly capped at 10% of gross (SD7)
    const accommodationLimit = grossPay * ACCOMMODATION_MAX_PCT;
    const accommodation =
        input.includeAccommodation ? Math.min(input.accommodationCost ?? accommodationLimit, accommodationLimit) : undefined;

    const otherDeductions = input.otherDeductions ?? 0;

    const totalDeductions = roundTo(uifEmployee + (accommodation ?? 0) + otherDeductions);

    // Net pay cannot drop below 0
    const netPay = Math.max(0, roundTo(grossPay - totalDeductions));

    // Compliance Warnings
    const complianceWarnings: string[] = [];
    if (input.hourlyRate < activeNmwRate) {
        complianceWarnings.push(`Hourly rate (R${input.hourlyRate}) is below the statutory NMW for this period (R${activeNmwRate}).`);
    }

    // Leave Accrual (SD7: 1 day for every 17 days worked)
    const leaveAccruedDays = Number(((input.daysWorked ?? 1) / 17).toFixed(2));

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
            uifEmployee,
            accommodation,
            other: otherDeductions,
            total: totalDeductions,
        },
        employerContributions: {
            uifEmployer,
            sdlEmployer,
        },
        netPay,
        complianceWarnings,
        leaveAccruedDays,
        leaveTaken: {
            annual: input.annualLeaveTaken ?? 0,
            sick: input.sickLeaveTaken ?? 0,
            family: input.familyLeaveTaken ?? 0,
        }
    };
}
