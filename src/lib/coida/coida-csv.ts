import { format } from "date-fns";
import { Employee, PayslipInput } from "../schema";
import { RoeData } from "./roe";
import { calculatePayslip } from "../calculator";

/**
 * Generates a CSV string for the ROE Detailed Payroll Report.
 */
export function generateRoeCsv(
    roeData: RoeData,
    employees: Employee[],
    allPayslips: PayslipInput[]
): string {
    const headers = [
        "Employee Name",
        "ID/Passport",
        "Period Start",
        "Period End",
        "Gross Pay (R)",
        "Capped Earnings (R)"
    ];

    const periodPayslips = allPayslips.filter(ps => {
        const end = new Date(ps.payPeriodEnd);
        return end >= roeData.startDate && end <= roeData.endDate;
    });

    const rows: string[][] = [];

    employees.forEach(emp => {
        const empPayslips = periodPayslips.filter(ps => ps.employeeId === emp.id);
        if (empPayslips.length === 0) return;

        let empTotalGross = 0;
        empPayslips.forEach(ps => {
            const res = calculatePayslip(ps);
            empTotalGross += res.grossPay;

            rows.push([
                emp.name,
                emp.idNumber || "N/A",
                format(new Date(ps.payPeriodStart), "yyyy-MM-dd"),
                format(new Date(ps.payPeriodEnd), "yyyy-MM-dd"),
                res.grossPay.toFixed(2),
                "---" // Capping applied on total
            ]);
        });

        // Add summary row for employee
        const capped = Math.min(empTotalGross, roeData.maxCapPerEmployee);
        rows.push([
            `${emp.name} (TOTAL)`,
            emp.idNumber || "N/A",
            "---",
            "---",
            empTotalGross.toFixed(2),
            capped.toFixed(2)
        ]);
        rows.push([]); // Blank line for readability
    });

    // Add final total
    rows.push([
        "GRAND TOTAL",
        "",
        "",
        "",
        "",
        roeData.actualEarnings.toFixed(2)
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return csvContent;
}
