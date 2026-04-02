import { describe, expect, it } from "vitest";
import { buildPayrollSummary } from "./payroll-summary";
import type { PayslipInput } from "./schema";

function buildPayslip(overrides: Partial<PayslipInput> = {}): PayslipInput {
    return {
        id: "ps-1",
        householdId: "default",
        employeeId: "emp-1",
        payPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
        payPeriodEnd: new Date("2026-04-30T00:00:00.000Z"),
        ordinaryHours: 160,
        overtimeHours: 10,
        sundayHours: 8,
        publicHolidayHours: 8,
        daysWorked: 20,
        shortFallHours: 0,
        hourlyRate: 35,
        includeAccommodation: false,
        otherDeductions: 0,
        createdAt: new Date("2026-04-30T10:00:00.000Z"),
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
        ...overrides,
    };
}

describe("buildPayrollSummary", () => {
    it("returns the full UIF and employer-cost breakdown", () => {
        const summary = buildPayrollSummary(buildPayslip());

        expect(summary.grossPay).toBeGreaterThan(0);
        expect(summary.employeeUifDeduction).toBeGreaterThan(0);
        expect(summary.employerUifContribution).toBe(summary.employeeUifDeduction);
        expect(summary.totalUifDue).toBe(summary.employeeUifDeduction + summary.employerUifContribution);
        expect(summary.netPayToEmployee).toBeLessThan(summary.grossPay);
        expect(summary.employerTotalCost).toBe(summary.grossPay + summary.employerUifContribution);
    });

    it("keeps UIF at zero when the period is below the UIF threshold", () => {
        const summary = buildPayrollSummary(buildPayslip({
            ordinaryHours: 4,
            overtimeHours: 0,
            sundayHours: 0,
            publicHolidayHours: 0,
            daysWorked: 1,
            payPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
            payPeriodEnd: new Date("2026-04-07T00:00:00.000Z"),
        }));

        expect(summary.employeeUifDeduction).toBe(0);
        expect(summary.employerUifContribution).toBe(0);
        expect(summary.totalUifDue).toBe(0);
        expect(summary.employerTotalCost).toBe(summary.grossPay);
    });
});
