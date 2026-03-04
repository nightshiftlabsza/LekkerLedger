/**
 * Alert Engine — Epic 8
 * Pure function: no async, no side effects.
 * Takes already-loaded dashboard data, returns a typed alert list.
 * Extensible: add new alert types by pushing to the `alerts` array.
 */

import { format, differenceInDays } from "date-fns";
import type { Employee, PayslipInput, EmployerSettings, LeaveRecord } from "./schema";
import { calculateLeaveBalances } from "./leave";

export type AlertSeverity = "info" | "warning" | "urgent";

export interface DashboardAlert {
    id: string;
    severity: AlertSeverity;
    message: string;
    action?: { label: string; href: string };
}

interface EmployeeLeaveContext {
    employee: Employee;
    leaveRecords: LeaveRecord[];
    totalDaysWorked: number;
}

interface AlertParams {
    employees: Employee[];
    summaries: Array<{ employee: Employee; latestPayslip: PayslipInput | null }>;
    settings: EmployerSettings | null;
    now: Date;
    leaveContexts?: EmployeeLeaveContext[];
}

export function computeDashboardAlerts({ employees, summaries, settings, now, leaveContexts = [] }: AlertParams): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];

    if (employees.length === 0) return alerts;

    const currentMonth = format(now, "yyyy-MM");
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();

    // Employees whose latest payslip is NOT in the current month (or have no payslip at all)
    const unpaidThisMonth = summaries.filter(s =>
        !s.latestPayslip ||
        format(new Date(s.latestPayslip.payPeriodStart), "yyyy-MM") !== currentMonth
    );

    // 1. Employer details missing
    if (!settings?.employerName?.trim()) {
        alerts.push({
            id: "employer-missing",
            severity: "warning",
            message: "Employer details missing — payslips will have a blank header",
            action: { label: "Fix it →", href: "/settings" },
        });
    }

    // 2. Payday due (urgent, aggregate — suppresses per-employee warnings to avoid spam)
    if (daysLeft <= 5 && unpaidThisMonth.length > 0) {
        const n = unpaidThisMonth.length;
        const plural = n === 1 ? "" : "s";
        const dayPlural = daysLeft === 1 ? "" : "s";
        const action = n === 1
            ? { label: "Create now →", href: `/wizard?empId=${unpaidThisMonth[0].employee.id}` }
            : { label: "Bulk run →", href: "#bulk" };

        alerts.push({
            id: "payday-due",
            severity: "urgent",
            message: `Payroll due — ${n} employee${plural} haven't been paid this month (${daysLeft} day${dayPlural} left)`,
            action,
        });

        // Return early — don't stack per-employee warnings on top of the aggregate urgent alert
        return alerts;
    }

    // 3. Per-employee missing payslip (only outside month-end window)
    for (const s of summaries) {
        // Only warn about employees who have PRIOR payslips (not brand-new employees)
        if (!s.latestPayslip) continue;
        if (format(new Date(s.latestPayslip.payPeriodStart), "yyyy-MM") !== currentMonth) {
            alerts.push({
                id: `missing-hours-${s.employee.id}`,
                severity: "warning",
                message: `No payslip for ${s.employee.name} this month`,
                action: { label: "Create →", href: `/wizard?empId=${s.employee.id}` },
            });
        }
    }

    // 4. Leave balance — annual leave over 15 days (BCEA carry-over risk)
    for (const ctx of leaveContexts) {
        if (!ctx.employee.startDate) continue;
        const balances = calculateLeaveBalances(ctx.employee.startDate, ctx.totalDaysWorked, ctx.leaveRecords, now);
        if (balances.annual.remaining > 15) {
            alerts.push({
                id: `leave-overaccrual-${ctx.employee.id}`,
                severity: "warning",
                message: `${ctx.employee.name} has ${balances.annual.remaining} leave days — encourage taking leave before year-end`,
                action: { label: "View leave →", href: `/leave?employeeId=${ctx.employee.id}` },
            });
        }
    }

    // 5. Contract expiry — employees with an endDate (fixed-term) within 30 days
    for (const emp of employees) {
        // Fixed-term contracts store an optional endDate on the employee.
        // Cast to any to access it gracefully if it exists.
        const endDate = (emp as Record<string, unknown>).endDate as string | undefined;
        if (!endDate) continue;
        const end = new Date(endDate);
        const daysToExpiry = differenceInDays(end, now);
        if (daysToExpiry >= 0 && daysToExpiry <= 30) {
            alerts.push({
                id: `contract-expiry-${emp.id}`,
                severity: daysToExpiry <= 7 ? "urgent" : "warning",
                message: `${emp.name}'s contract expires in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"} — renew or issue notice`,
                action: { label: "View contracts →", href: "/contracts" },
            });
        }
    }

    return alerts;
}
