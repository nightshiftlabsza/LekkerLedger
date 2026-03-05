import { describe, it, expect } from "vitest";
import { calculatePayslip, NMW_RATE } from "./calculator";
import { PayslipInput } from "./schema";

describe("calculatePayslip() - Complex SD7 Edge Cases", () => {
    const mockInput: PayslipInput = {
        id: "ps-1",
        employeeId: "emp-1",
        payPeriodStart: new Date("2026-03-01"),
        payPeriodEnd: new Date("2026-03-31"),
        ordinaryHours: 160,
        overtimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        daysWorked: 22,
        shortFallHours: 0,
        hourlyRate: NMW_RATE,
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        includeAccommodation: false,
        accommodationCost: 0,
        otherDeductions: 0,
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
        createdAt: new Date(),
    };

    it("1. should flag a warning when hourly rate is below NMW", () => {
        const result = calculatePayslip({ ...mockInput, hourlyRate: 20 });
        expect(result.complianceWarnings[0]).toContain("is below the statutory NMW");
    });

    it("2. should strictly cap the accommodation deduction at 10% of gross pay", () => {
        const result = calculatePayslip({
            ...mockInput,
            includeAccommodation: true,
            accommodationCost: 1000,
        });
        expect(result.deductions.accommodation).toBeCloseTo(483.68, 2);
    });

    it("3. should handle 0 hours worked gracefully", () => {
        const result = calculatePayslip({
            ...mockInput,
            ordinaryHours: 0,
            daysWorked: 0,
        });
        expect(result.grossPay).toBe(0);
        expect(result.netPay).toBe(0);
        expect(result.deductions.total).toBe(0);
    });

    it("4. should apply correct multiplier for Sunday/Holiday hours", () => {
        const result = calculatePayslip({
            ...mockInput,
            ordinaryHours: 0,
            publicHolidayHours: 5,
        });
        const expected = 5 * NMW_RATE * 2;
        expect(result.publicHolidayPay).toBeCloseTo(expected, 2);
    });

    it("5. should calculate pro-rata annual leave accurately (1 day per 17 days)", () => {
        const result = calculatePayslip({ ...mockInput, daysWorked: 34 });
        expect(result.leaveAccruedDays).toBe(2);
    });

    it("6. applies the 4-hour minimum even when the shift only contains overtime hours", () => {
        const result = calculatePayslip({
            ...mockInput,
            ordinaryHours: 0,
            overtimeHours: 2,
            daysWorked: 1,
            hourlyRate: 100,
        });

        expect(result.effectiveOrdinaryHours).toBe(2);
        expect(result.grossPay).toBe(500);
    });
});
