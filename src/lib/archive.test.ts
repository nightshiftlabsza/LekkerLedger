import { describe, expect, it } from "vitest";
import { PLANS } from "../config/plans";
import { getStandardRetentionStatus, isGeneratedPayrollDocument, isWithinArchiveWindow, filterRecordsForArchiveWindow, isUploadedDocument, isWithinDowngradeGracePeriod } from "./archive";
import type { DocumentMeta } from "./schema";

const baseDocument: DocumentMeta = {
    id: "doc-1",
    householdId: "default",
    type: "payslip",
    employeeId: "emp-1",
    fileName: "March payslip.pdf",
    mimeType: "application/pdf",
    source: "generated",
    createdAt: "2026-03-01T00:00:00.000Z",
};

describe("getStandardRetentionStatus", () => {
    it("shows the recurring Standard reminder when no dismissal exists", () => {
        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.isStandard).toBe(true);
        expect(status.showReminder).toBe(true);
        expect(status.showElevenMonthWarning).toBe(false);
    });

    it("suppresses the reminder for 30 days after dismissal", () => {
        const hiddenStatus = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [],
            dismissedAt: "2026-03-01T00:00:00.000Z",
            now: new Date("2026-03-15T00:00:00.000Z"),
        });
        const visibleAgainStatus = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [],
            dismissedAt: "2026-02-01T00:00:00.000Z",
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(hiddenStatus.showReminder).toBe(false);
        expect(visibleAgainStatus.showReminder).toBe(true);
    });

    it("warns at 11 months and purges only generated payroll documents after 12 months", () => {
        const purgeCandidate: DocumentMeta = {
            ...baseDocument,
            id: "old-generated",
            createdAt: "2025-03-14T00:00:00.000Z",
        };
        const warningCandidate: DocumentMeta = {
            ...baseDocument,
            id: "warning-generated",
            createdAt: "2025-04-14T00:00:00.000Z",
        };
        const uploadedContractCopy: DocumentMeta = {
            ...baseDocument,
            id: "uploaded-contract",
            type: "archive",
            source: "uploaded",
            vaultCategory: "contracts",
            createdAt: "2024-03-14T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [purgeCandidate, warningCandidate, uploadedContractCopy],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.showElevenMonthWarning).toBe(true);
        expect(status.warningCount).toBe(1);
        expect(status.purgeCount).toBe(1);
        expect(status.purgeCandidates.map((document) => document.id)).toEqual(["old-generated"]);
        expect(status.oldestAffectedAt).toBe("2025-03-14T00:00:00.000Z");
    });

    it("never shows Standard retention UI for Pro", () => {
        const status = getStandardRetentionStatus({
            plan: PLANS.pro,
            documents: [
                {
                    ...baseDocument,
                    createdAt: "2025-03-14T00:00:00.000Z",
                },
            ],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.isStandard).toBe(false);
        expect(status.showReminder).toBe(false);
        expect(status.showElevenMonthWarning).toBe(false);
        expect(status.purgeCount).toBe(0);
    });

    it("never shows Standard retention UI for Free", () => {
        const status = getStandardRetentionStatus({
            plan: PLANS.free,
            documents: [
                {
                    ...baseDocument,
                    createdAt: "2025-03-14T00:00:00.000Z",
                },
            ],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.isStandard).toBe(false);
        expect(status.showReminder).toBe(false);
        expect(status.purgeCount).toBe(0);
    });

    it("does not purge documents at exactly 12 months boundary", () => {
        const exactlyTwelveMonths: DocumentMeta = {
            ...baseDocument,
            id: "boundary-doc",
            createdAt: "2025-03-15T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [exactlyTwelveMonths],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.purgeCount).toBe(0);
    });

    it("purges documents clearly older than 12 months", () => {
        const olderThanTwelveMonths: DocumentMeta = {
            ...baseDocument,
            id: "old-doc",
            createdAt: "2025-02-01T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [olderThanTwelveMonths],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.purgeCount).toBe(1);
    });

    it("excludes uploaded documents from purge even when old", () => {
        const oldUploadedDoc: DocumentMeta = {
            ...baseDocument,
            id: "old-upload",
            source: "uploaded",
            type: "contract",
            createdAt: "2023-01-01T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [oldUploadedDoc],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.purgeCount).toBe(0);
    });

    it("excludes export-type documents with uploaded source from purge", () => {
        const uploadedExport: DocumentMeta = {
            ...baseDocument,
            id: "uploaded-archive",
            source: "uploaded",
            type: "archive",
            vaultCategory: "admin",
            createdAt: "2023-01-01T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [uploadedExport],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.purgeCount).toBe(0);
    });
});

describe("isGeneratedPayrollDocument", () => {
    it("returns true for generated payslips", () => {
        expect(isGeneratedPayrollDocument({ ...baseDocument, source: "generated", type: "payslip" })).toBe(true);
    });

    it("returns true for generated exports", () => {
        expect(isGeneratedPayrollDocument({ ...baseDocument, source: "generated", type: "export" })).toBe(true);
    });

    it("returns false for uploaded documents", () => {
        expect(isGeneratedPayrollDocument({ ...baseDocument, source: "uploaded", type: "payslip" })).toBe(false);
    });

    it("returns false for contracts", () => {
        expect(isGeneratedPayrollDocument({ ...baseDocument, source: "generated", type: "contract" })).toBe(false);
    });

    it("returns false for archive-type documents", () => {
        expect(isGeneratedPayrollDocument({ ...baseDocument, source: "generated", type: "archive" })).toBe(false);
    });
});

describe("isUploadedDocument", () => {
    it("returns true for uploaded source", () => {
        expect(isUploadedDocument({ ...baseDocument, source: "uploaded" })).toBe(true);
    });

    it("returns false for generated source", () => {
        expect(isUploadedDocument({ ...baseDocument, source: "generated" })).toBe(false);
    });
});

describe("isWithinArchiveWindow", () => {
    it("includes recent records for Standard", () => {
        expect(isWithinArchiveWindow(PLANS.standard, "2026-03-01T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(true);
    });

    it("excludes old records for Standard", () => {
        expect(isWithinArchiveWindow(PLANS.standard, "2025-01-01T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(false);
    });

    it("includes 4-year-old records for Pro", () => {
        expect(isWithinArchiveWindow(PLANS.pro, "2022-06-01T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(true);
    });

    it("excludes 6-year-old records for Pro", () => {
        expect(isWithinArchiveWindow(PLANS.pro, "2020-01-01T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(false);
    });

    it("returns true for invalid dates (fail-safe)", () => {
        expect(isWithinArchiveWindow(PLANS.standard, "not-a-date", new Date("2026-03-15T00:00:00.000Z"))).toBe(true);
    });
});

describe("filterRecordsForArchiveWindow", () => {
    it("always shows uploaded documents regardless of age", () => {
        const oldUpload: DocumentMeta = { ...baseDocument, id: "old-upload", source: "uploaded", createdAt: "2020-01-01T00:00:00.000Z" };
        const result = filterRecordsForArchiveWindow(
            [oldUpload],
            PLANS.standard,
            (d) => d.createdAt,
            { alwaysVisible: isUploadedDocument, now: new Date("2026-03-15T00:00:00.000Z") },
        );
        expect(result.visible).toHaveLength(1);
        expect(result.hidden).toHaveLength(0);
    });

    it("hides old generated documents for Standard", () => {
        const oldGenerated: DocumentMeta = { ...baseDocument, id: "old-gen", source: "generated", createdAt: "2024-01-01T00:00:00.000Z" };
        const result = filterRecordsForArchiveWindow(
            [oldGenerated],
            PLANS.standard,
            (d) => d.createdAt,
            { now: new Date("2026-03-15T00:00:00.000Z") },
        );
        expect(result.visible).toHaveLength(0);
        expect(result.hidden).toHaveLength(1);
    });
});

describe("isWithinDowngradeGracePeriod", () => {
    it("returns true within 30 days of downgrade", () => {
        expect(isWithinDowngradeGracePeriod("2026-03-01T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(true);
    });

    it("returns false after 30 days have passed", () => {
        expect(isWithinDowngradeGracePeriod("2026-02-01T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(false);
    });

    it("returns false when no downgrade date is provided", () => {
        expect(isWithinDowngradeGracePeriod(undefined, new Date("2026-03-15T00:00:00.000Z"))).toBe(false);
    });

    it("returns false for invalid date strings", () => {
        expect(isWithinDowngradeGracePeriod("not-a-date", new Date("2026-03-15T00:00:00.000Z"))).toBe(false);
    });

    it("returns false at exactly 30 days (boundary)", () => {
        // 30 days after 2026-02-13 is 2026-03-15
        expect(isWithinDowngradeGracePeriod("2026-02-13T00:00:00.000Z", new Date("2026-03-15T00:00:00.000Z"))).toBe(false);
    });
});

describe("getStandardRetentionStatus with grace period", () => {
    it("returns graceActive true and purgeCount 0 during grace period", () => {
        const oldDoc: DocumentMeta = {
            ...baseDocument,
            id: "old-doc",
            createdAt: "2025-02-01T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [oldDoc],
            planDowngradedAt: "2026-03-01T00:00:00.000Z",
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.graceActive).toBe(true);
        expect(status.purgeCount).toBe(0);
        expect(status.purgeCandidates).toHaveLength(1); // candidates still identified
    });

    it("returns graceActive false and normal purgeCount after grace period expires", () => {
        const oldDoc: DocumentMeta = {
            ...baseDocument,
            id: "old-doc",
            createdAt: "2025-02-01T00:00:00.000Z",
        };

        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [oldDoc],
            planDowngradedAt: "2026-01-01T00:00:00.000Z",
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.graceActive).toBe(false);
        expect(status.purgeCount).toBe(1);
        expect(status.purgeCandidates).toHaveLength(1);
    });

    it("returns graceActive false when no downgrade date is provided", () => {
        const status = getStandardRetentionStatus({
            plan: PLANS.standard,
            documents: [],
            now: new Date("2026-03-15T00:00:00.000Z"),
        });

        expect(status.graceActive).toBe(false);
    });
});
