import { describe, expect, it } from "vitest";
import { EmployeeSchema, PayslipInputSchema } from "./schema";

describe("schema validation", () => {
    it("allows historical employee rates when the start date uses an older NMW", () => {
        const parsed = EmployeeSchema.safeParse({
            id: crypto.randomUUID(),
            name: "Historic Worker",
            role: "Domestic Worker",
            hourlyRate: 28.79,
            startDate: "2025-03-15",
            ordinaryHoursPerDay: 8,
            frequency: "Monthly",
            ordinarilyWorksSundays: false,
        });

        expect(parsed.success).toBe(true);
    });

    it("rejects payslips with ordinary hours but no days worked", () => {
        const parsed = PayslipInputSchema.safeParse({
            id: "payslip-1",
            employeeId: "emp-1",
            payPeriodStart: "2026-03-01",
            payPeriodEnd: "2026-03-31",
            ordinaryHours: 8,
            overtimeHours: 0,
            sundayHours: 0,
            publicHolidayHours: 0,
            daysWorked: 0,
            shortFallHours: 0,
            hourlyRate: 30.23,
            includeAccommodation: false,
            otherDeductions: 0,
            createdAt: new Date(),
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            annualLeaveTaken: 0,
            sickLeaveTaken: 0,
            familyLeaveTaken: 0,
        });

        expect(parsed.success).toBe(false);
        expect(parsed.error?.issues.some((issue) => issue.path.join(".") === "daysWorked")).toBe(true);
    });

    it("accepts empty string email for optional email field", () => {
        const parsed = EmployeeSchema.safeParse({
            id: crypto.randomUUID(),
            name: "Email Test Worker",
            role: "Domestic Worker",
            hourlyRate: 30.23,
            ordinaryHoursPerDay: 8,
            frequency: "Monthly",
            ordinarilyWorksSundays: false,
            email: "",
        });

        expect(parsed.success).toBe(true);
    });

    it("rejects invalid email format", () => {
        const parsed = EmployeeSchema.safeParse({
            id: crypto.randomUUID(),
            name: "Email Test Worker",
            role: "Domestic Worker",
            hourlyRate: 30.23,
            ordinaryHoursPerDay: 8,
            frequency: "Monthly",
            ordinarilyWorksSundays: false,
            email: "notanemail",
        });

        expect(parsed.success).toBe(false);
        expect(parsed.error?.issues.some((issue) => issue.path.join(".") === "email")).toBe(true);
    });
});
