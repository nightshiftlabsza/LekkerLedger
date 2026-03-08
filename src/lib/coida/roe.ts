import { getAllPayslips } from "../storage";
import { getCoidaParameters } from "../legal/coida";
import { calculatePayslip } from "../calculator";

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
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (isLeapYear(startYear + 1)) {
        endDate.setDate(29);
    }

    const payslips = await getAllPayslips();
    const params = getCoidaParameters(startDate);

    // Filter payslips within the COID year
    const periodPayslips = payslips.filter(ps => {
        const end = new Date(ps.payPeriodEnd);
        return end >= startDate && end <= endDate;
    });

    const activeEmployeeIds = new Set(periodPayslips.map(ps => ps.employeeId));
    const employeeCount = activeEmployeeIds.size;

    const earningsPerEmployee: Record<string, number> = {};

    periodPayslips.forEach(ps => {
        const breakdown = calculatePayslip(ps);
        const currentSum = earningsPerEmployee[ps.employeeId] || 0;
        earningsPerEmployee[ps.employeeId] = currentSum + breakdown.grossPay;
    });

    // Apply the cap to each employee's total annual earnings
    const actualEarnings = Object.values(earningsPerEmployee).reduce((sum, annualGross) => {
        return sum + Math.min(annualGross, params.earningsCap);
    }, 0);

    // Provisional earnings usually include an estimated 5% increase for inflation/raises
    const PROVISIONAL_INFLATION_BUFFER = 1.05;

    return {
        coidYear: startYear.toString(),
        startDate,
        endDate,
        employeeCount,
        actualEarnings: Math.round(actualEarnings),
        provisionalEarnings: Math.round(actualEarnings * PROVISIONAL_INFLATION_BUFFER),
        maxCapPerEmployee: params.earningsCap,
        assessmentRate: params.assessmentRate,
        minAssessment: params.minAssessmentDomestic,
    };
}
