/**
 * Alert Engine — Epic 8
 * Pure function: no async, no side effects.
 * Takes already-loaded dashboard data, returns a typed alert list.
 * Extensible: add new alert types by pushing to the `alerts` array.
 */

import { format } from "date-fns";
import type { Employee, PayslipInput, EmployerSettings } from "./schema";

export type AlertSeverity = "info" | "warning" | "urgent";

export interface DashboardAlert {
    id: string;
    severity: AlertSeverity;
    message: string;
    action?: { label: string; href: string };
}

interface AlertParams {
    employees: Employee[];
    summaries: Array<{ employee: Employee; latestPayslip: PayslipInput | null }>;
    settings: EmployerSettings | null;
    now: Date;
}

export function computeDashboardAlerts({ employees, summaries, settings, now }: AlertParams): DashboardAlert[] {
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

    return alerts;
}
