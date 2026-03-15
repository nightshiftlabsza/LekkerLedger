import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import {
    calculateOrdinaryHoursFromStandardDays,
    calculateShortfallHours,
    derivePayslipDraft,
    normalizePayslipDraftToInput,
} from "./payslip-draft";

describe("payslip draft helpers", () => {
    it("calculates ordinary hours from standard working days", () => {
        expect(calculateOrdinaryHoursFromStandardDays(20, 8)).toBe(160);
    });

    it("calculates shortfall hours from short shifts", () => {
        expect(calculateShortfallHours(1, 2)).toBe(2);
        expect(calculateShortfallHours(2, 9)).toBe(0);
    });

    it("preserves manual ordinary-hours override", () => {
        const derived = derivePayslipDraft({
            householdId: "default",
            employeeId: "emp-1",
            monthKey: "2026-03",
            standardWorkingDaysThisMonth: 20,
            ordinaryHoursPerDay: 8,
            ordinaryHoursOverride: 168,
            overtimeHours: 0,
            sundayHours: 0,
            publicHolidayHours: 0,
            shortShiftCount: 0,
            shortShiftWorkedHours: 0,
            hourlyRate: 40,
            ordinarilyWorksSundays: false,
            includeAccommodation: false,
            otherDeductions: 0,
        });

        expect(derived.autoOrdinaryHours).toBe(160);
        expect(derived.ordinaryHours).toBe(168);
        expect(derived.hasManualOrdinaryHoursOverride).toBe(true);
    });

    it("normalizes a monthly draft into a payslip input", () => {
        const payslip = normalizePayslipDraftToInput({
            householdId: "default",
            employeeId: "emp-1",
            monthKey: "2026-03",
            standardWorkingDaysThisMonth: 20,
            ordinaryHoursPerDay: 8,
            overtimeHours: 8,
            sundayHours: 8,
            publicHolidayHours: 8,
            shortShiftCount: 1,
            shortShiftWorkedHours: 2,
            hourlyRate: 40,
            ordinarilyWorksSundays: true,
            includeAccommodation: false,
            otherDeductions: 0,
        });

        expect(payslip.ordinaryHours).toBe(160);
        expect(payslip.daysWorked).toBe(20);
        expect(payslip.shortFallHours).toBe(2);
        expect(format(payslip.payPeriodStart, "yyyy-MM-dd")).toBe("2026-03-01");
        expect(format(payslip.payPeriodEnd, "yyyy-MM-dd")).toBe("2026-03-31");
    });
});
