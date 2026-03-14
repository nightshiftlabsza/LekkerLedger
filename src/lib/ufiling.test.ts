import { describe, expect, it } from "vitest";
import { rowsToCsv, type UFilingRow } from "./ufiling";
import type { EmployerSettings } from "./schema";

describe("rowsToCsv()", () => {
    it("preserves leading zeros in ID numbers for spreadsheet apps", () => {
        const rows: UFilingRow[] = [
            {
                employeeName: "Nomsa Dube",
                idNumber: "0123456789012",
                periodStart: "2026-03-01",
                periodEnd: "2026-03-31",
                grossRemuneration: 5000,
                uifEmployee: 50,
                uifEmployer: 50,
                totalUif: 100,
            },
        ];

        const settings = {
            employerName: "Example Household",
            employerAddress: "1 Example Street",
            employerIdNumber: "",
            uifRefNumber: "U1234567",
            cfNumber: "",
            sdlNumber: "",
            phone: "",
            employerEmail: "",
            proStatus: "standard",
            billingCycle: "monthly",
            activeHouseholdId: "default",
            logoData: "",
            defaultLanguage: "en",
            density: "comfortable",
            piiObfuscationEnabled: true,
            installationId: "",
            usageHistory: [],
            customLeaveTypes: [],
        } satisfies EmployerSettings;

        const csv = rowsToCsv(rows, settings);

        expect(csv).toContain('"=""0123456789012"""');
    });
});
