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
 * Generates a compliance audit based on SD7 and NMW Act.
 */
export function getComplianceAudit(employee: Employee, breakdown: PayBreakdown, date: Date = new Date()): ComplianceAudit {
    const nmw = getNMWForDate(date);

    // 1. Wage Compliance
    const isWageCompliant = employee.hourlyRate >= nmw;
    const wageStatusText = isWageCompliant
        ? `COMPLIANT (R${employee.hourlyRate.toFixed(2)}/hr)`
        : `NON-COMPLIANT (R${employee.hourlyRate.toFixed(2)}/hr is below the R${nmw.toFixed(2)}/hr minimum)`;

    // 2. UIF Compliance (check if it was applied if hours > 24)
    const totalHours = breakdown.totalHours;
    const expectedUIF = totalHours > UIF_THRESHOLD_HOURS ? Math.min(breakdown.grossPay, 17712) * UIF_RATE : 0;
    const isUifCompliant = Math.abs(breakdown.deductions.uifEmployee - expectedUIF) < 0.01;
    const uifStatusText = totalHours > UIF_THRESHOLD_HOURS
        ? (isUifCompliant ? "Compliant (1% deducted)" : "NON-COMPLIANT (Incorrect deduction)")
        : "Not Applicable (≤ 24hrs/month)";

    // 3. Accommodation Deduction Check (Max 10% of gross pay)
    const accommodationValue = breakdown.deductions.accommodation ?? 0;
    const maxAccommodation = breakdown.grossPay * ACCOMMODATION_MAX_PCT;
    const isAccommodationCompliant = accommodationValue <= maxAccommodation + 0.01; // Allow for tiny float rounding
    const accommodationStatusText = isAccommodationCompliant
        ? `Compliant (<= 10% of gross)`
        : `NON-COMPLIANT (Exceeds 10% of gross pay)`;

    // 4. Sunday Pay Multiplier
    const sundayRateMultiplier = employee.ordinarilyWorksSundays ? "1.5x" : "2.0x";

    return {
        wageCompliant: isWageCompliant,
        wageStatusText,
        uifCompliant: isUifCompliant,
        uifStatusText,
        accommodationCompliant: isAccommodationCompliant,
        accommodationStatusText,
        sundayMultiplier: sundayRateMultiplier,
        overtimeRate: "1.5x",
    };
}

/**
 * Generates the human-readable text block requested from Gemini 3.1.
 */
export function generateComplianceNoteText(employee: Employee, breakdown: PayBreakdown, date: Date = new Date()): string {
    const audit = getComplianceAudit(employee, breakdown, date);
    const nmw = getNMWForDate(date);

    return `
======================================================================
CONTRACT & COMPLIANCE SUMMARY: ${employee.name.toUpperCase()} (${employee.role})
ID Number: ${employee.idNumber || "NOT PROVIDED"}
======================================================================

1. WAGE & DEDUCTION COMPLIANCE (BCEA, SD7 & COIDA)
----------------------------------------------------------------------
* Minimum Wage Status      : ${audit.wageStatusText}
* UIF Deduction (1%)       : R${breakdown.deductions.uifEmployee.toFixed(2)} (${audit.uifStatusText})
* COIDA Coverage           : Mandatory for all domestic workers (2026 Ruling).
* Accommodation Deduction  : R${(breakdown.deductions.accommodation ?? 0).toFixed(2)} - ${audit.accommodationStatusText}
* Sunday Work Rate         : ${audit.sundayMultiplier} normal wage
* Overtime Rate            : ${audit.overtimeRate} normal wage (for hours exceeding 45/week)

2. LEAVE ENTITLEMENTS (BCEA & SD7)
----------------------------------------------------------------------
* Annual Leave             : 3 weeks per 12-month cycle, or 1 day for every 17 days worked.
* Sick Leave               : 1 day for every 26 days worked (first 6 months). Thereafter, the number of days normally worked in 6 weeks over a 36-month cycle.
* Family Responsibility    : 5 days per year (applicable if employed > 4 months and working >= 4 days/week).
* Maternity Leave          : Up to 4 consecutive months unpaid (claimable via UIF).

3. ADDITIONAL SD7 & COIDA CLAUSES
----------------------------------------------------------------------
* Notice Period            : 1 week if employed for 6 months or less; 4 weeks if employed for more than 6 months.
* COIDA Registration       : Employers must be registered with the Compensation Commissioner.
* Record Keeping           : The employer must retain these written particulars of employment for 3 years after termination.

> NOTE: This summary is generated for administrative reference. Any non-compliant items marked above must be rectified to align with the Department of Employment and Labour regulations (BCEA, COIDA, and UIF).
`.trim();
}
