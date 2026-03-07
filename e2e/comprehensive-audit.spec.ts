import { test } from "@playwright/test";
import { AUDIT_ACTIONS } from "./audit/manifest";
import { runAuditAction, writeAuditReport } from "./audit/helpers";
import type { AuditResult } from "./audit/types";

const auditResults: AuditResult[] = [];
const groups = Array.from(new Set(AUDIT_ACTIONS.map((action) => action.group)));

test.describe("Comprehensive audit matrix", () => {
    test.describe.configure({ mode: "serial" });

    for (const group of groups) {
        test(`runs the ${group} action audit`, async ({ browser }) => {
            test.setTimeout(12 * 60 * 1000);
            const groupActions = AUDIT_ACTIONS.filter((action) => action.group === group);

            for (const action of groupActions) {
                const page = await browser.newPage();
                try {
                    const result = await runAuditAction(page, action);
                    auditResults.push(result);
                } finally {
                    await page.close();
                }
            }

            console.log(`${group} actions executed: ${groupActions.length}`);
            console.log(`${group} failures flagged: ${auditResults.filter((result) => result.action.group === group && result.status === "failed").length}`);
        });
    }

    test("writes the combined markdown audit report", async () => {
        const reportPath = await writeAuditReport(auditResults);
        console.log(`Audit actions executed: ${auditResults.length}`);
        console.log(`Audit failures flagged: ${auditResults.filter((result) => result.status === "failed").length}`);
        console.log(`Audit report written to: ${reportPath}`);
    });
});
