import { beforeEach, describe, expect, it } from "vitest";
import {
    exportData,
    getAllLeaveRecords,
    getDocumentFile,
    getDocuments,
    getLocalBackupPreview,
    getSettings,
    hasMeaningfulLocalData,
    purgeDocumentMetas,
    resetAllData,
    saveDocumentFile,
    saveDocumentMeta,
    saveEmployee,
    saveHousehold,
    saveLeaveRecord,
    savePayslip,
    saveSettings,
    setActiveHouseholdId,
} from "./storage";
import { getLocalRecoveryProfile, saveLocalRecoveryProfile } from "./recovery-profile-store";
import type { DocumentMeta, Employee, LeaveRecord, PayslipInput } from "./schema";

const baseEmployee: Employee = {
    id: "00000000-0000-4000-8000-000000000001",
    householdId: "default",
    name: "Test Employee",
    idNumber: "1234567890123",
    role: "Domestic Worker",
    hourlyRate: 30.23,
    phone: "0821234567",
    email: "",
    address: "",
    startDate: "2026-03-01",
    startDateIsApproximate: false,
    leaveCycleStartDate: "",
    leaveCycleEndDate: "",
    annualLeaveBalanceAsOfDate: "",
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
    advanceAmount: 0,
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
        const settings = await getSettings();
        await saveSettings({
            ...settings,
            employerName: "Main household",
            employerAddress: "1 Example Street",
        });
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

    it("rejects payslips when employer details are missing", async () => {
        const settings = await getSettings();
        await saveSettings({
            ...settings,
            employerName: "",
            employerAddress: "",
        });

        await expect(savePayslip(basePayslip)).rejects.toThrow(/employer name and address/i);
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

        expect(records).toEqual([expect.objectContaining({
            ...leaveRecord,
            typeLabel: "Annual leave",
            updatedAt: expect.any(String),
        })]);
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

    it("clears locally cached recovery keys during a full local reset", async () => {
        await saveLocalRecoveryProfile("user-1", {
            keySetupComplete: true,
            validationPayload: null,
            recoveryKey: "B5YR-35DH-8L2R-WY6R-Z5XL-2KMZ-PQWA-7EUQ",
            updatedAt: new Date("2026-03-14T12:00:00.000Z").toISOString(),
        });

        expect(await getLocalRecoveryProfile("user-1")).toEqual(
            expect.objectContaining({
                recoveryKey: "B5YR-35DH-8L2R-WY6R-Z5XL-2KMZ-PQWA-7EUQ",
            }),
        );

        await resetAllData();

        expect(await getLocalRecoveryProfile("user-1")).toBeNull();
    });

    it("provides accurate local backup previews", async () => {
        let preview = await getLocalBackupPreview();
        expect(preview.employeeCount).toBe(0);

        await saveEmployee(baseEmployee);
        await savePayslip(basePayslip);

        preview = await getLocalBackupPreview();
        expect(preview.employeeCount).toBe(1);
        expect(preview.payslipCount).toBe(1);
    });

    it("preserves paid access dates across normal settings saves", async () => {
        const settings = await getSettings();
        const paidUntil = "2026-04-24T12:00:00.000Z";

        await saveSettings({
            ...settings,
            paidUntil,
        });

        const updatedSettings = await getSettings();
        await saveSettings({
            ...updatedSettings,
            employerName: "Main household",
            paidUntil: undefined,
        });

        const reloadedSettings = await getSettings();
        expect(reloadedSettings.paidUntil).toBe(paidUntil);
    });

    it("persists the Standard retention dismissal timestamp in account settings", async () => {
        const settings = await getSettings();
        await saveSettings({
            ...settings,
            standardRetentionNoticeDismissedAt: "2026-03-15T09:00:00.000Z",
        });

        const reloadedSettings = await getSettings();
        expect(reloadedSettings.standardRetentionNoticeDismissedAt).toBe("2026-03-15T09:00:00.000Z");
    });

    it("purges document metadata and backing files together", async () => {
        const documentMeta: DocumentMeta = {
            id: "doc-retention-1",
            householdId: "default",
            type: "payslip",
            employeeId: baseEmployee.id,
            fileName: "Historic payslip.pdf",
            mimeType: "application/pdf",
            source: "generated",
            createdAt: "2025-03-01T00:00:00.000Z",
        };

        await saveDocumentMeta(documentMeta);
        await saveDocumentFile(documentMeta.id, new Blob(["historic"], { type: "application/pdf" }));

        expect((await getDocuments()).map((document) => document.id)).toContain(documentMeta.id);
        expect(await getDocumentFile(documentMeta.id)).not.toBeNull();

        const purgedCount = await purgeDocumentMetas([documentMeta.id]);

        expect(purgedCount).toBe(1);
        expect((await getDocuments()).map((document) => document.id)).not.toContain(documentMeta.id);
        expect(await getDocumentFile(documentMeta.id)).toBeNull();
    });
});
