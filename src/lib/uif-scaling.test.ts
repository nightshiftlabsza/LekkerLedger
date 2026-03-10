import { calculatePayslip } from "./calculator";
import { PayslipInput } from "./schema";
import { describe, it, expect } from "vitest";

describe("UIF scaling logic", () => {
    it("should calculate UIF for a weekly employee working > 5.5 hours", () => {
        // 1 week (7 days), 10 hours. Threshold is (24 / 4.33) * 1 = 5.54h.
        // 10h > 5.54h, so UIF should be applied.
        const input: PayslipInput = {
            id: "test",
            employeeId: "emp1",
            householdId: "h1",
            createdAt: new Date().toISOString(),
            payPeriodStart: "2026-03-01",
            payPeriodEnd: "2026-03-07", // 7 days
            ordinaryHours: 10,
            overtimeHours: 0,
            sundayHours: 0,
            publicHolidayHours: 0,
            hourlyRate: 100,
            daysWorked: 1,
            otherDeductions: 0,
            shortFallHours: 0,
            accommodationDeduction: 0,
        };

        const breakdown = calculatePayslip(input);
        expect(breakdown.grossPay).toBe(1000);
        expect(breakdown.deductions.uifEmployee).toBeGreaterThan(0); // 1% of 1000 = 10
        expect(breakdown.deductions.uifEmployee).toBe(10);
    });

    it("should NOT calculate UIF for a weekly employee working <= 5.5 hours", () => {
        // 1 week, 5 hours. 5h < 5.54h.
        const input: PayslipInput = {
            id: "test2",
            employeeId: "emp1",
            householdId: "h1",
            createdAt: new Date().toISOString(),
            payPeriodStart: "2026-03-01",
            payPeriodEnd: "2026-03-07",
            ordinaryHours: 5,
            overtimeHours: 0,
            sundayHours: 0,
            publicHolidayHours: 0,
            hourlyRate: 100,
            daysWorked: 1,
            otherDeductions: 0,
            shortFallHours: 0,
            accommodationDeduction: 0,
        };

        const breakdown = calculatePayslip(input);
        expect(breakdown.grossPay).toBe(500);
        expect(breakdown.deductions.uifEmployee).toBe(0);
    });
});
