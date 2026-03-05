import { describe, expect, it } from "vitest";
import { exportData, getAllLeaveRecords, saveEmployee, saveLeaveRecord, savePayslip } from "./storage";
import type { Employee, LeaveRecord, PayslipInput } from "./schema";

const baseEmployee: Employee = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Test Employee",
    idNumber: "1234567890123",
    role: "Domestic Worker",
    hourlyRate: 30.23,
    phone: "0821234567",
    startDate: "2026-03-01",
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    frequency: "Monthly",
};

const basePayslip: PayslipInput = {
    id: "payslip-1",
    employeeId: baseEmployee.id,
    payPeriodStart: new Date("2026-03-01"),
    payPeriodEnd: new Date("2026-03-31"),
    ordinaryHours: 160,
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    daysWorked: 20,
    shortFallHours: 0,
    hourlyRate: 30.23,
    includeAccommodation: false,
    accommodationCost: 0,
    otherDeductions: 0,
    createdAt: new Date("2026-03-31T08:00:00Z"),
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    annualLeaveTaken: 0,
    sickLeaveTaken: 0,
    familyLeaveTaken: 0,
};

describe("storage safeguards", () => {
    it("rejects duplicate employee ID numbers", async () => {
        await saveEmployee(baseEmployee);

        await expect(saveEmployee({
            ...baseEmployee,
            id: "00000000-0000-4000-8000-000000000002",
            name: "Duplicate Employee",
        })).rejects.toThrow(/already exists/i);
    });

    it("rejects duplicate payslips for the same employee and period", async () => {
        await savePayslip(basePayslip);

        await expect(savePayslip({
            ...basePayslip,
            id: "payslip-2",
        })).rejects.toThrow(/already exists/i);
    });

    it("round-trips leave records through encoded storage and export", async () => {
        const leaveRecord: LeaveRecord = {
            id: "leave-1",
            employeeId: baseEmployee.id,
            type: "annual",
            days: 2,
            date: "2026-03-15",
            note: "Family trip",
        };

        await saveLeaveRecord(leaveRecord);
        const records = await getAllLeaveRecords();
        const backup = await exportData();

        expect(records).toEqual([leaveRecord]);
        expect(backup).toContain('"leave"');
        expect(backup).toContain('"type": "annual"');
    });
});
