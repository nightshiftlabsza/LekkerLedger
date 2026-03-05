import { getAllPayslips, getEmployees } from "../storage";
import { getCoidaParameters } from "../legal/coida";

export interface RoeData {
    coidYear: string;
    startDate: Date;
    endDate: Date;
    employeeCount: number;
    actualEarnings: number;
    provisionalEarnings: number;
    maxCapPerEmployee: number;
    assessmentRate: number;
    minAssessment: number;
}

/**
 * Calculates the Return of Earnings data for a given COID year.
 * @param startYear The year the COID assessment starts (e.g. 2024 for 1 Mar 2024 - 28 Feb 2025)
 */
export async function calculateRoeData(startYear: number): Promise<RoeData> {
    const startDate = new Date(startYear, 2, 1); // 1 March
    const endDate = new Date(startYear + 1, 1, 28); // 28 Feb

    // Handle leap year for Feb
    if ((startYear + 1) % 4 === 0 && ((startYear + 1) % 100 !== 0 || (startYear + 1) % 400 === 0)) {
        endDate.setDate(29);
    }

    const payslips = await getAllPayslips();
    const params = getCoidaParameters(startDate);

    // Filter payslips within the COID year
    // We use payPeriodEnd to determine which year a payslip falls into
    const periodPayslips = payslips.filter(ps => {
        const end = new Date(ps.payPeriodEnd);
        return end >= startDate && end <= endDate;
    });

    // Count employees who had at least one payslip in this period
    const activeEmployeeIds = new Set(periodPayslips.map(ps => ps.employeeId));
    const employeeCount = activeEmployeeIds.size;

    // Calculate actual earnings per employee, capped at the statutory limit
    const earningsPerEmployee: Record<string, number> = {};

    // We need to calculate each payslip's gross pay. 
    // Since getAllPayslips returns PayslipInput, we might need the calculator.
    // However, it's better if we just sum the gross pay if it was stored, 
    // but schema.ts doesn't show grossPay in PayslipInput.
    // It is calculated in calculatePayslip(input).

    const { calculatePayslip } = await import("../calculator");

    periodPayslips.forEach(ps => {
        const breakdown = calculatePayslip(ps);
        const currentSum = earningsPerEmployee[ps.employeeId] || 0;
        earningsPerEmployee[ps.employeeId] = currentSum + breakdown.grossPay;
    });

    // Apply the cap to each employee's total annual earnings
    const actualEarnings = Object.values(earningsPerEmployee).reduce((sum, annualGross) => {
        return sum + Math.min(annualGross, params.earningsCap);
    }, 0);

    return {
        coidYear: startYear.toString(),
        startDate,
        endDate,
        employeeCount,
        actualEarnings: Math.round(actualEarnings),
        provisionalEarnings: Math.round(actualEarnings), // Default to actuals
        maxCapPerEmployee: params.earningsCap,
        assessmentRate: params.assessmentRate,
        minAssessment: params.minAssessmentDomestic,
    };
}
