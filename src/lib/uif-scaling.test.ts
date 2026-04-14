import { calculatePayslip } from "./calculator";
import { PayslipInput } from "./schema";
import { describe, it, expect } from "vitest";

const baseInput: PayslipInput = {
    id: "test",
    employeeId: "emp1",
    householdId: "h1",
    createdAt: new Date(),
    payPeriodStart: new Date("2026-03-01"),
    payPeriodEnd: new Date("2026-03-07"), // 7 days = 1 week
    ordinaryHours: 10,
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    hourlyRate: 100,
    daysWorked: 1,
    otherDeductions: 0,
    shortFallHours: 0,
    includeAccommodation: false,
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    annualLeaveTaken: 0,
    sickLeaveTaken: 0,
    familyLeaveTaken: 0,
};

describe("UIF threshold logic", () => {
    it("does not calculate UIF for a monthly payslip at exactly 24 hours", () => {
        const breakdown = calculatePayslip({
            ...baseInput,
            id: "test1",
            payPeriodStart: new Date("2026-03-01"),
            payPeriodEnd: new Date("2026-03-31"),
            ordinaryHours: 24,
            daysWorked: 3,
        });

        expect(breakdown.grossPay).toBe(2400);
        expect(breakdown.deductions.uifEmployee).toBe(0);
        expect(breakdown.employerContributions.uifEmployer).toBe(0);
    });

    it("does calculate UIF once monthly hours go above 24", () => {
        const breakdown = calculatePayslip({
            ...baseInput,
            id: "test2",
            payPeriodStart: new Date("2026-03-01"),
            payPeriodEnd: new Date("2026-03-31"),
            ordinaryHours: 25,
            daysWorked: 4,
        });

        expect(breakdown.grossPay).toBe(2500);
        expect(breakdown.deductions.uifEmployee).toBe(25);
        expect(breakdown.employerContributions.uifEmployer).toBe(25);
    });

    it("does not let 4-hour minimum-pay top-ups create UIF eligibility by themselves", () => {
        const breakdown = calculatePayslip({
            ...baseInput,
            id: "test3",
            payPeriodStart: new Date("2026-03-01"),
            payPeriodEnd: new Date("2026-03-31"),
            ordinaryHours: 20,
            daysWorked: 6,
        });

        expect(breakdown.grossPay).toBe(2400);
        expect(breakdown.totalHours).toBe(24);
        expect(breakdown.uifQualifyingHours).toBe(20);
        expect(breakdown.deductions.uifEmployee).toBe(0);
    });

    it("caps UIF at the monthly ceiling", () => {
        const breakdown = calculatePayslip({
            ...baseInput,
            id: "test4",
            payPeriodStart: new Date("2026-03-01"),
            payPeriodEnd: new Date("2026-03-31"),
            ordinaryHours: 200,
            hourlyRate: 100,
            daysWorked: 25,
        });

        expect(breakdown.grossPay).toBe(20000);
        expect(breakdown.deductions.uifEmployee).toBe(177.12);
        expect(breakdown.employerContributions.uifEmployer).toBe(177.12);
    });
});
