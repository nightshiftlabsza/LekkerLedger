import { PayslipInput } from "./schema";

export const NMW_RATE = 30.23; // SD7 as of March 2025
const UIF_MONTHLY_CAP = 17712; // UIF contribution ceiling
const ACCOMMODATION_MAX_PCT = 0.10;
const UIF_RATE = 0.01;
const UIF_THRESHOLD_HOURS = 24; // No UIF if worker ≤ 24 hours
const OVERTIME_MULTIPLIER = 1.5;
const SUNDAY_PH_MULTIPLIER = 2.0;

export interface PayBreakdown {
    ordinaryPay: number;
    effectiveOrdinaryHours: number;
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
    };
    netPay: number;
}

export function calculatePayslip(input: PayslipInput): PayBreakdown {
    // Enforce NMW guardrail (backup to schema validation)
    const rate = Math.max(input.hourlyRate, NMW_RATE);

    // 4-hour shift rule: if total ordinary hours on specific days < 4, 
    // the wizard passes 'shortFallHours' to precisely top-up the pay.
    const effectiveOrdinaryHours = input.ordinaryHours + (input.shortFallHours ?? 0);

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

    // Accommodation: provided cost, strictly capped at 10% of gross (SD7)
    const accommodationLimit = grossPay * ACCOMMODATION_MAX_PCT;
    const accommodation =
        input.includeAccommodation ? Math.min(input.accommodationCost ?? accommodationLimit, accommodationLimit) : undefined;

    const otherDeductions = input.otherDeductions ?? 0;

    const totalDeductions = uifEmployee + (accommodation ?? 0) + otherDeductions;

    // Net pay cannot drop below 0
    const netPay = Math.max(0, grossPay - totalDeductions);

    return {
        ordinaryPay,
        effectiveOrdinaryHours,
        overtimePay,
        sundayPay,
        publicHolidayPay,
        grossPay,
        totalHours,
        deductions: {
            uifEmployee,
            accommodation,
            other: otherDeductions,
            total: totalDeductions,
        },
        employerContributions: {
            uifEmployer,
        },
        netPay,
    };
}
