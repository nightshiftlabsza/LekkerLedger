/**
 * uFiling CSV Export
 *
 * Generates a CSV for the Department of Labour's uFiling system.
 * Format follows the standard UIF declaration columns.
 */

import { Employee, PayslipInput, EmployerSettings } from "./schema";
import { calculatePayslip } from "./calculator";
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { getCurrentTaxYearRange } from "./storage";

export interface UFilingRow {
    employeeName: string;
    idNumber: string;
    periodStart: string;
    periodEnd: string;
    grossRemuneration: number;
    uifEmployee: number;
    uifEmployer: number;
    totalUif: number;
}

export function generateUFilingData(
    employees: Employee[],
    payslips: PayslipInput[],
    month: number, // 0-indexed
    year: number
): UFilingRow[] {
    const rows: UFilingRow[] = [];
    const targetMonthStart = startOfMonth(new Date(year, month));
    const targetMonthEnd = endOfMonth(new Date(year, month));

    for (const emp of employees) {
        const empPayslips = payslips.filter((p) => {
            const endDate = new Date(p.payPeriodEnd);
            return (
                p.employeeId === emp.id &&
                isWithinInterval(endDate, { start: targetMonthStart, end: targetMonthEnd })
            );
        });

        for (const ps of empPayslips) {
            const breakdown = calculatePayslip(ps);
            rows.push({
                employeeName: emp.name,
                idNumber: emp.idNumber || "",
                periodStart: format(new Date(ps.payPeriodStart), "yyyy-MM-dd"),
                periodEnd: format(new Date(ps.payPeriodEnd), "yyyy-MM-dd"),
                grossRemuneration: breakdown.grossPay,
                uifEmployee: breakdown.deductions.uifEmployee,
                uifEmployer: breakdown.employerContributions.uifEmployer,
                totalUif: breakdown.deductions.uifEmployee + breakdown.employerContributions.uifEmployer,
            });
        }
    }

    return rows;
}

export function generateUFilingTaxYearData(
    employees: Employee[],
    payslips: PayslipInput[],
    yearEnd: number // e.g. 2026 for the 2025/2026 tax year
): UFilingRow[] {
    const taxYear = getCurrentTaxYearRange(new Date(yearEnd, 1, 15)); // mid Feb of end year
    const rows: UFilingRow[] = [];

    for (const emp of employees) {
        const empPayslips = payslips.filter((p) => {
            const endDate = new Date(p.payPeriodEnd);
            return (
                p.employeeId === emp.id &&
                endDate >= taxYear.start &&
                endDate <= taxYear.end
            );
        });

        for (const ps of empPayslips) {
            const breakdown = calculatePayslip(ps);
            rows.push({
                employeeName: emp.name,
                idNumber: emp.idNumber || "",
                periodStart: format(new Date(ps.payPeriodStart), "yyyy-MM-dd"),
                periodEnd: format(new Date(ps.payPeriodEnd), "yyyy-MM-dd"),
                grossRemuneration: breakdown.grossPay,
                uifEmployee: breakdown.deductions.uifEmployee,
                uifEmployer: breakdown.employerContributions.uifEmployer,
                totalUif: breakdown.deductions.uifEmployee + breakdown.employerContributions.uifEmployer,
            });
        }
    }

    return rows;
}

export function rowsToCsv(rows: UFilingRow[], settings: EmployerSettings): string {
    const header = [
        "Employer Name",
        "UIF Ref Number",
        "Employee Name",
        "ID / Passport Number",
        "Period Start",
        "Period End",
        "Gross Remuneration",
        "Employee UIF (1%)",
        "Employer UIF (1%)",
        "Total UIF",
    ].map(h => `"${h}"`).join(",");

    const dataRows = rows.map((r) =>
        [
            `"${settings.employerName.replace(/"/g, '""')}"`,
            `"${settings.uifRefNumber.replace(/"/g, '""')}"`,
            `"${r.employeeName.replace(/"/g, '""')}"`,
            `"${r.idNumber.replace(/"/g, '""')}"`,
            `"${r.periodStart}"`,
            `"${r.periodEnd}"`,
            r.grossRemuneration.toFixed(2),
            r.uifEmployee.toFixed(2),
            r.uifEmployer.toFixed(2),
            r.totalUif.toFixed(2),
        ].join(",")
    );

    return [header, ...dataRows].join("\r\n"); // Standard CSV CRLF
}

export function downloadCsv(csv: string, filename: string): void {
    if (typeof window === "undefined") return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
