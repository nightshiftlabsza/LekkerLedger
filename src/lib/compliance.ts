import { Employee } from "./schema";
import { PayBreakdown, ACCOMMODATION_MAX_PCT, UIF_RATE, UIF_THRESHOLD_HOURS } from "./calculator";
import { getNMWForDate } from "./legal/registry";

export interface ComplianceAudit {
    wageCompliant: boolean;
    wageStatusText: string;
    uifCompliant: boolean;
    uifStatusText: string;
    accommodationCompliant: boolean;
    accommodationStatusText: string;
    sundayMultiplier: string;
    overtimeRate: string;
}

/**
 * Generates household payroll checks using rate and deduction references.
 */
export function getComplianceAudit(employee: Employee, breakdown: PayBreakdown, date: Date | string = new Date()): ComplianceAudit {
    const safeDate = new Date(date);
    const nmw = getNMWForDate(safeDate);

    // 1. Wage check
    const meetsWageCheck = employee.hourlyRate >= nmw;
    const wageStatusText = meetsWageCheck
        ? `Meets the current minimum-wage check (R${employee.hourlyRate.toFixed(2)}/hr)`
        : `Below the current minimum-wage check (R${employee.hourlyRate.toFixed(2)}/hr vs R${nmw.toFixed(2)}/hr)`;

    // 2. UIF check (check if it was applied if hours > 24)
    const totalHours = breakdown.totalHours;
    const expectedUIF = totalHours > UIF_THRESHOLD_HOURS ? Math.min(breakdown.grossPay, 17712) * UIF_RATE : 0;
    const meetsUifCheck = Math.abs(breakdown.deductions.uifEmployee - expectedUIF) < 0.01;
    const uifStatusText = totalHours > periodUifThreshold
        ? (meetsUifCheck ? "Matches the 1% deduction check" : "Differs from the 1% deduction check")
        : `Not Applicable (≤ ${periodUifThreshold.toFixed(1)}hrs/period)`;

    // 3. Accommodation deduction check (Max 10% of gross pay)
    const accommodationValue = breakdown.deductions.accommodation ?? 0;
    const maxAccommodation = breakdown.grossPay * ACCOMMODATION_MAX_PCT;
    const meetsAccommodationCheck = accommodationValue <= maxAccommodation + 0.01; // Allow for tiny float rounding
    const accommodationStatusText = meetsAccommodationCheck
        ? "Within the 10% accommodation check"
        : "Above the 10% accommodation check";

    // 4. Sunday Pay Multiplier
    const sundayRateMultiplier = employee.ordinarilyWorksSundays ? "1.5x" : "2.0x";

    return {
        wageCompliant: meetsWageCheck,
        wageStatusText,
        uifStatusText,
        uifCompliant: meetsUifCheck,
        accommodationCompliant: meetsAccommodationCheck,
        accommodationStatusText,
        sundayMultiplier: sundayRateMultiplier,
        overtimeRate: "1.5x",
    };
}

/**
 * Generates a human-readable record summary for the current payslip checks.
 */
export function generateComplianceNoteText(employee: Employee, breakdown: PayBreakdown, date: Date | string = new Date()): string {
    const safeDate = new Date(date);
    const audit = getComplianceAudit(employee, breakdown, safeDate);


    return `
======================================================================
PAYROLL CHECK SUMMARY: ${employee.name.toUpperCase()} (${employee.role})
ID Number: ${employee.idNumber || "NOT PROVIDED"}
======================================================================

1. PAY & DEDUCTION CHECKS
----------------------------------------------------------------------
* Minimum Wage Status      : ${audit.wageStatusText}
* UIF Deduction (1%)       : R${breakdown.deductions.uifEmployee.toFixed(2)} (${audit.uifStatusText})
* COIDA Registration       : Check that the employer is registered with the Compensation Fund where required.
* Accommodation Deduction  : R${(breakdown.deductions.accommodation ?? 0).toFixed(2)} - ${audit.accommodationStatusText}
* Sunday Work Rate         : ${audit.sundayMultiplier} normal wage
* Overtime Rate            : ${audit.overtimeRate} normal wage (for hours exceeding 45/week)

2. LEAVE REFERENCE NOTES
----------------------------------------------------------------------
* Annual Leave             : 3 weeks per 12-month cycle, or 1 day for every 17 days worked.
* Sick Leave               : 1 day for every 26 days worked (first 6 months). Thereafter, the number of days normally worked in 6 weeks over a 36-month cycle.
* Family Responsibility    : 5 days per year (applicable if employed > 4 months and working >= 4 days/week).
* Maternity Leave          : Up to 4 consecutive months unpaid (claimable via UIF).

3. ADDITIONAL RECORD NOTES
----------------------------------------------------------------------
* Notice Period            : 1 week if employed for 6 months or less; 4 weeks if employed for more than 6 months.
* COIDA Registration       : Employers must be registered with the Compensation Commissioner.
* Record Keeping           : The employer must retain these written particulars of employment for 3 years after termination.

> NOTE: This summary is a calculation check for administrative reference. Review the figures against your records and official guidance before relying on it.
`.trim();
}
