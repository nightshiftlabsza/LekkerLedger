import { describe, expect, it } from "vitest";
import type { Employee, PayslipInput } from "./schema";
import { buildPayslipPdfTemplateData } from "./pdf";

const employee: Employee = {
    id: "11111111-1111-1111-1111-111111111111",
    householdId: "default",
    name: "Nomsa Dlamini",
    idNumber: "8001010234081",
    role: "Domestic Worker",
    hourlyRate: 30.23,
    phone: "0123456789",
    email: "",
    address: "",
    startDate: "2024-01-01",
    startDateIsApproximate: false,
    leaveCycleStartDate: "",
    leaveCycleEndDate: "",
    annualLeaveBalanceAsOfDate: "",
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    frequency: "Monthly",
};

function buildPayslip(overrides: Partial<PayslipInput> = {}): PayslipInput {
    return {
        id: "ps-1",
        householdId: "default",
        employeeId: employee.id,
        payPeriodStart: new Date("2025-01-01T00:00:00.000Z"),
        payPeriodEnd: new Date("2025-01-31T00:00:00.000Z"),
        ordinaryHours: 160,
        overtimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        daysWorked: 22,
        shortFallHours: 0,
        hourlyRate: employee.hourlyRate,
        advanceAmount: 0,
        includeAccommodation: false,
        accommodationCost: undefined,
        otherDeductions: 0,
        createdAt: new Date("2025-01-31T10:00:00.000Z"),
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
        ...overrides,
    };
}

describe("buildPayslipPdfTemplateData", () => {
    it("uses the saved month-based period for the header and body", () => {
        const templateData = buildPayslipPdfTemplateData(employee, buildPayslip(), "en");

        expect(templateData.headerPeriodLabel).toBe("JANUARY 2025");
        expect(templateData.payPeriodLabel).toBe("01 Jan 2025 - 31 Jan 2025");
        expect(templateData.daysWorkedLine).toBe("Days Worked: 22 days");
        expect(templateData.paymentDateLine).toBe("Payment Date: 31 Jan 2025");
    });

    it("uses the stored payment date fallback from the saved period end when createdAt is missing", () => {
        const templateData = buildPayslipPdfTemplateData(
            employee,
            buildPayslip({
                payPeriodStart: new Date("2024-08-05T00:00:00.000Z"),
                payPeriodEnd: new Date("2024-08-25T00:00:00.000Z"),
                createdAt: undefined as unknown as Date,
            }),
            "en",
        );

        expect(templateData.headerPeriodLabel).toBe("AUGUST 2024");
        expect(templateData.payPeriodLabel).toBe("05 Aug 2024 - 25 Aug 2024");
        expect(templateData.paymentDateLine).toBe("Payment Date: 25 Aug 2024");
    });

    it("shows a month span in the header when the saved payslip crosses months", () => {
        const templateData = buildPayslipPdfTemplateData(
            employee,
            buildPayslip({
                payPeriodStart: new Date("2025-01-20T00:00:00.000Z"),
                payPeriodEnd: new Date("2025-02-19T00:00:00.000Z"),
            }),
            "en",
        );

        expect(templateData.headerPeriodLabel).toBe("JAN - FEB 2025");
        expect(templateData.payPeriodLabel).toBe("20 Jan 2025 - 19 Feb 2025");
    });

    it("builds a leave summary only when leave was actually taken", () => {
        const noLeave = buildPayslipPdfTemplateData(employee, buildPayslip(), "en");
        expect(noLeave.leaveSummaryLine).toBeNull();

        const withLeave = buildPayslipPdfTemplateData(
            employee,
            buildPayslip({
                annualLeaveTaken: 2,
                sickLeaveTaken: 1,
                familyLeaveTaken: 0.5,
            }),
            "en",
        );

        expect(withLeave.leaveSummaryLine).toBe(
            "Leave taken in this period: Annual: 2 days | Sick: 1 day | Family: 0.5 days",
        );
    });
});
