import { describe, it, expect } from "vitest";
import { getComplianceAudit } from "./compliance";
import { Employee } from "./schema";
import { PayBreakdown } from "./calculator";

describe("Compliance Logic (SD7 & NMW)", () => {
    const mockEmployee: Employee = {
        id: "emp-1",
        householdId: "default",
        name: "Test Worker",
        idNumber: "1234567890123",
        role: "Domestic Worker",
        hourlyRate: 30.23,
        phone: "",
        address: "",
        startDate: "2026-01-01",
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        frequency: "Monthly",
    };

    const mockBreakdown: PayBreakdown = {
        hourlyRate: 30.23,
        ordinaryPay: 4836.80,
        effectiveOrdinaryHours: 160,
        overtimePay: 0,
        sundayPay: 0,
        publicHolidayPay: 0,
        grossPay: 4836.80,
        totalHours: 160,
        deductions: {
            uifEmployee: 48.37,
            accommodation: undefined,
            other: 0,
            total: 48.37,
        },
        employerContributions: {
            uifEmployer: 48.37,
            sdlEmployer: 0,
        },
        netPay: 4788.43,
        complianceWarnings: [],
        leaveAccruedDays: 1.29,
        leaveTaken: {
            annual: 0,
            sick: 0,
            family: 0,
        },
    };

    it("should mark wage as compliant if at or above NMW", () => {
        const audit = getComplianceAudit(mockEmployee, mockBreakdown);
        expect(audit.wageCompliant).toBe(true);
        expect(audit.wageStatusText).toContain("Meets the current minimum-wage check");
    });

    it("should mark wage as non-compliant if below NMW", () => {
        const lowPayEmp = { ...mockEmployee, hourlyRate: 25.00 };
        const audit = getComplianceAudit(lowPayEmp, mockBreakdown);
        expect(audit.wageCompliant).toBe(false);
        expect(audit.wageStatusText).toContain("Below the current minimum-wage check");
    });

    it("should verify UIF compliance for > 24 hours", () => {
        const audit = getComplianceAudit(mockEmployee, mockBreakdown);
        expect(audit.uifCompliant).toBe(true);
        expect(audit.uifStatusText).toContain("Matches the 1% deduction check");
    });

    it("should mark UIF as NOT applicable for ≤ 24 hours", () => {
        const lowHoursBreakdown = { ...mockBreakdown, totalHours: 20, deductions: { ...mockBreakdown.deductions, uifEmployee: 0 } };
        const audit = getComplianceAudit(mockEmployee, lowHoursBreakdown);
        expect(audit.uifStatusText).toContain("Not Applicable");
    });

    it("should detect non-compliant accommodation deduction (>10%)", () => {
        const highAccommodationBreakdown = {
            ...mockBreakdown,
            deductions: { ...mockBreakdown.deductions, accommodation: 600 } // > 10% of 4836.80
        };
        const audit = getComplianceAudit(mockEmployee, highAccommodationBreakdown);
        expect(audit.accommodationCompliant).toBe(false);
        expect(audit.accommodationStatusText).toContain("Above the 10% accommodation check");
    });

    it("should suggest 1.5x Sunday multiplier if worker ordinarily works Sundays", () => {
        const sundayWorker = { ...mockEmployee, ordinarilyWorksSundays: true };
        const audit = getComplianceAudit(sundayWorker, mockBreakdown);
        expect(audit.sundayMultiplier).toBe("1.5x");
    });

    it("should suggest 2.0x Sunday multiplier if worker does NOT ordinarily work Sundays", () => {
        const occasionalSundayWorker = { ...mockEmployee, ordinarilyWorksSundays: false };
        const audit = getComplianceAudit(occasionalSundayWorker, mockBreakdown);
        expect(audit.sundayMultiplier).toBe("2.0x");
    });
});



