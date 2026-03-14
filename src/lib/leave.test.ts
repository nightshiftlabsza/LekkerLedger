import { describe, expect, it } from "vitest";
import { calculateAnnualLeaveSummary, getLeaveAllowanceForType } from "./leave";
import type { Employee, LeaveRecord } from "./schema";

function buildEmployee(overrides: Partial<Employee> = {}): Employee {
    return {
        id: crypto.randomUUID(),
        householdId: "default",
        name: "Thandi Dlamini",
        idNumber: "",
        role: "Domestic Worker",
        hourlyRate: 30.23,
        phone: "",
        email: "",
        address: "",
        startDate: "",
        startDateIsApproximate: false,
        leaveCycleStartDate: "",
        leaveCycleEndDate: "",
        annualLeaveDaysRemaining: undefined,
        annualLeaveBalanceAsOfDate: "",
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        frequency: "Monthly",
        updatedAt: "",
        ...overrides,
    };
}

function buildAnnualLeave(days: number, date: string): LeaveRecord {
    return {
        id: crypto.randomUUID(),
        householdId: "default",
        employeeId: "emp-1",
        type: "annual",
        days,
        date,
        startDate: date,
        endDate: date,
        note: "",
    };
}

describe("manual leave setup", () => {
    it("uses a saved manual leave balance as the available amount", () => {
        const employee = buildEmployee({
            annualLeaveDaysRemaining: 12,
            annualLeaveBalanceAsOfDate: "2026-03-14",
        });

        const summary = calculateAnnualLeaveSummary(employee, [], [], new Date("2026-03-20"));

        expect(summary.totalRemainingAvailable).toBe(12);
        expect(summary.currentCycle).toBeNull();
    });

    it("reduces a manual balance only by leave recorded after the saved balance date", () => {
        const employee = buildEmployee({
            leaveCycleStartDate: "2026-03-01",
            leaveCycleEndDate: "2027-02-28",
            annualLeaveDaysRemaining: 12,
            annualLeaveBalanceAsOfDate: "2026-03-14",
        });

        const records = [
            buildAnnualLeave(2, "2026-03-10"),
            buildAnnualLeave(1.5, "2026-03-18"),
        ];

        const summary = calculateAnnualLeaveSummary(employee, records, [], new Date("2026-03-20"));

        expect(summary.usedInCurrentCycle).toBe(1.5);
        expect(summary.totalRemainingAvailable).toBe(10.5);
    });

    it("lets a manual cycle override the automatic cycle dates", () => {
        const employee = buildEmployee({
            startDate: "2025-10-01",
            leaveCycleStartDate: "2026-03-01",
            leaveCycleEndDate: "2027-02-28",
        });

        const summary = calculateAnnualLeaveSummary(employee, [], [], new Date("2026-03-20"));

        expect(summary.currentCycle?.startIso).toBe("2026-03-01");
        expect(summary.currentCycle?.endIso).toBe("2027-02-28");
    });

    it("uses the manual balance in allowance checks", () => {
        const employee = buildEmployee({
            annualLeaveDaysRemaining: 8,
            annualLeaveBalanceAsOfDate: "2026-03-14",
        });

        const allowance = getLeaveAllowanceForType("annual", [buildAnnualLeave(2, "2026-03-20")], [], new Date("2026-03-21"), [], employee);

        expect(allowance.remaining).toBe(6);
    });
});
