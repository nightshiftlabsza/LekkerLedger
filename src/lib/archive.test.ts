import { describe, expect, it } from "vitest";
import { PLANS } from "../config/plans";
import { getStandardRetentionStatus } from "./archive";
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
});
