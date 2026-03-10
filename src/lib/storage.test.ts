import { beforeEach, describe, expect, it } from "vitest";
import {
    exportData,
    getAllLeaveRecords,
    getLocalBackupPreview,
    getSettings,
    hasMeaningfulLocalData,
    resetAllData,
    saveEmployee,
    saveHousehold,
    saveLeaveRecord,
    savePayslip,
    saveSettings,
    setActiveHouseholdId,
} from "./storage";
import type { Employee, LeaveRecord, PayslipInput } from "./schema";

const baseEmployee: Employee = {
    id: "00000000-0000-4000-8000-000000000001",
    householdId: "default",
    name: "Test Employee",
    idNumber: "1234567890123",
    role: "Domestic Worker",
    hourlyRate: 30.23,
    phone: "0821234567",
    address: "",
    startDate: "2026-03-01",
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    frequency: "Monthly",
};

const basePayslip: PayslipInput = {
    id: "payslip-1",
    householdId: "default",
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
    beforeEach(async () => {
        await resetAllData();
    });

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

    it("keeps employer settings scoped to each household", async () => {
        const defaultSettings = await getSettings();
        await saveSettings({
            ...defaultSettings,
            employerName: "Main household",
            employerAddress: "1 Example Street",
        });

        await saveHousehold({
            id: "household-2",
            name: "Second household",
            createdAt: new Date("2026-03-02T00:00:00Z").toISOString(),
        });
        await setActiveHouseholdId("household-2");

        const secondHouseholdSettings = await getSettings();
        expect(secondHouseholdSettings.employerName).toBe("");
        expect(secondHouseholdSettings.employerAddress).toBe("");

        await saveSettings({
            ...secondHouseholdSettings,
            employerName: "Second household",
            employerAddress: "2 Example Street",
        });

        await setActiveHouseholdId("default");
        const restoredDefaultSettings = await getSettings();

        expect(restoredDefaultSettings.employerName).toBe("Main household");
        expect(restoredDefaultSettings.employerAddress).toBe("1 Example Street");
    });

    it("round-trips leave records through encoded storage and export", async () => {
        const leaveRecord: LeaveRecord = {
            id: "leave-1",
            householdId: "default",
            employeeId: baseEmployee.id,
            type: "annual",
            days: 2,
            date: "2026-03-15",
            note: "Family trip",
        };

        await saveLeaveRecord(leaveRecord);
        const records = await getAllLeaveRecords();
        const backup = await exportData();

        expect(records).toEqual([{ ...leaveRecord, typeLabel: "Annual leave" }]);
        expect(backup).toContain('"leave"');
        expect(backup).toContain('"type": "annual"');
        expect(backup).toContain('"typeLabel": "Annual leave"');
        expect(backup).toContain('"householdSettings"');
    });

    it("identifies meaningful local data correctly", async () => {
        expect(await hasMeaningfulLocalData()).toBe(false);
        
        await saveEmployee(baseEmployee);
        expect(await hasMeaningfulLocalData()).toBe(true);
        
        await resetAllData();
        expect(await hasMeaningfulLocalData()).toBe(false);
    });

    it("provides accurate local backup previews", async () => {
        let preview = await getLocalBackupPreview();
        expect(preview.employeeCount).toBe(0);
        expect(preview.lastBackupTimestamp).toBeUndefined();

        await saveEmployee(baseEmployee);
        await savePayslip(basePayslip);
        
        const timestamp = new Date().toISOString();
        const settings = await getSettings();
        await saveSettings({ ...settings, lastBackupTimestamp: timestamp });

        preview = await getLocalBackupPreview();
        expect(preview.employeeCount).toBe(1);
        expect(preview.payslipCount).toBe(1);
        expect(preview.lastBackupTimestamp).toBe(timestamp);
    });

    it("preserves billing dates across normal settings saves", async () => {
        const settings = await getSettings();
        const trialExpiry = "2026-03-24T12:00:00.000Z";
        const paidUntil = "2026-04-24T12:00:00.000Z";

        await saveSettings({
            ...settings,
            trialExpiry,
            paidUntil,
        });

        const updatedSettings = await getSettings();
        await saveSettings({
            ...updatedSettings,
            employerName: "Main household",
            trialExpiry: undefined,
            paidUntil: undefined,
        });

        const reloadedSettings = await getSettings();
        expect(reloadedSettings.trialExpiry).toBe(trialExpiry);
        expect(reloadedSettings.paidUntil).toBe(paidUntil);
    });
});
