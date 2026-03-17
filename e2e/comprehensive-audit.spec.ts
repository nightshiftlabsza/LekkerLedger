import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { AUDIT_ACTIONS } from "./audit/manifest";
import { collectAuditMetrics, resetAndSeedAuditState, runAuditAction, writeAuditReport } from "./audit/helpers";
import type { AuditResult } from "./audit/types";

const auditResults: AuditResult[] = [];
const groups = Array.from(new Set(AUDIT_ACTIONS.map((action) => action.group)));
const pricingResponsiveBreakpoints = [
    { slug: "mobile-390", width: 390, height: 844 },
    { slug: "tablet-768", width: 768, height: 1024 },
    { slug: "desktop-1366", width: 1366, height: 900 },
    { slug: "ultrawide-2560", width: 2560, height: 1440 },
];
const pricingResponsiveSurfaces = [
    { slug: "home-pricing", route: "/", seed: "empty" as const },
    { slug: "pricing-page", route: "/pricing", seed: "empty" as const },
    { slug: "upgrade-page", route: "/upgrade", seed: "starter" as const },
    { slug: "settings-plan", route: "/settings?tab=plan", seed: "starter" as const },
];

async function assertPricingCopy(page: import("@playwright/test").Page) {
    await expect(page.locator("body")).not.toContainText("No account needed");
    await expect(page.locator("body")).toContainText("Planned features");
    await expect(page.locator("body")).toContainText("Android app access when available");
    await expect(page.locator("body")).toContainText("Notification reminders");
    await expect(page.locator("body")).toContainText("Advanced employment records");
}

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

    test("runs the pricing responsive sweep", async ({ browser }) => {
        test.setTimeout(6 * 60 * 1000);
        const screenshotDir = path.join(process.cwd(), "artifacts", "pricing-responsive-qa");
        await mkdir(screenshotDir, { recursive: true });

        for (const breakpoint of pricingResponsiveBreakpoints) {
            for (const surface of pricingResponsiveSurfaces) {
                const page = await browser.newPage({
                    viewport: { width: breakpoint.width, height: breakpoint.height },
                });

                try {
                    await resetAndSeedAuditState(page, surface.seed);
                    await page.goto(surface.route, { waitUntil: "domcontentloaded", timeout: 20_000 });
                    await page.waitForTimeout(1_000);

                    await assertPricingCopy(page);

                    const metrics = await collectAuditMetrics(page);
                    const finalUrl = new URL(page.url());
                    const expectedUrl = new URL(surface.route, "http://localhost:3002");

                    expect(finalUrl.pathname).toBe(expectedUrl.pathname);
                    expect(finalUrl.search).toBe(expectedUrl.search);
                    expect(metrics.overflow).toBe(false);
                    expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 4);

                    const screenshotPath = path.join(screenshotDir, `${breakpoint.slug}-${surface.slug}.png`);
                    await page.screenshot({ path: screenshotPath, fullPage: true });

                    console.log(
                        `[pricing-responsive] ${breakpoint.slug} ${surface.slug}: url=${page.url()} width=${metrics.innerWidth} scroll=${metrics.docScrollWidth}`,
                    );
                } finally {
                    await page.close();
                }
            }
        }
    });
});
