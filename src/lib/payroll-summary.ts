import { calculatePayslip, type PayBreakdown } from "./calculator";
import { roundTo } from "./money";
import type { PayslipInput } from "./schema";

export interface PayrollSummary {
    breakdown: PayBreakdown;
    grossPay: number;
    employeeUifDeduction: number;
    netPayToEmployee: number;
    employerUifContribution: number;
    totalUifDue: number;
    employerTotalCost: number;
}

export function buildPayrollSummaryFromBreakdown(breakdown: PayBreakdown): PayrollSummary {
    const employeeUifDeduction = breakdown.deductions.uifEmployee;
    const employerUifContribution = breakdown.employerContributions.uifEmployer;
    const totalUifDue = roundTo(employeeUifDeduction + employerUifContribution);
    const employerTotalCost = roundTo(breakdown.grossPay + employerUifContribution);

    return {
        breakdown,
        grossPay: breakdown.grossPay,
        employeeUifDeduction,
        netPayToEmployee: breakdown.netPay,
        employerUifContribution,
        totalUifDue,
        employerTotalCost,
    };
}

export function buildPayrollSummary(payslip: PayslipInput): PayrollSummary {
    return buildPayrollSummaryFromBreakdown(calculatePayslip(payslip));
}
