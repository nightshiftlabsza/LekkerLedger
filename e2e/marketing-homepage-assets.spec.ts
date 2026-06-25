import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { resetAndSeedAuditState } from "./audit/helpers";

const OUTPUT_DIR = path.join(process.cwd(), "artifacts", "marketing", "homepage");

test.describe("Homepage marketing asset capture", () => {
    test.describe.configure({ mode: "serial" });

    test("captures dashboard overview and contracts proof images from the real app", async ({ page }) => {
        await mkdir(OUTPUT_DIR, { recursive: true });

        await page.setViewportSize({ width: 1440, height: 960 });
        await resetAndSeedAuditState(page, "marketing-proof");

        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
        const dashboardProof = page.locator("main > div > div").filter({
            has: page.getByRole("heading", { name: "Employee payroll status" }),
        }).first();
        await expect(dashboardProof).toBeVisible();
        await dashboardProof.screenshot({
            path: path.join(OUTPUT_DIR, "homepage-dashboard-overview.png"),
        });

        await page.goto("/documents?tab=contracts", { waitUntil: "domcontentloaded" });
        const contractsProof = page.locator("section").filter({
            has: page.getByRole("heading", { name: /contracts/i }),
        }).first();
        await expect(contractsProof).toBeVisible();
        await contractsProof.screenshot({
            path: path.join(OUTPUT_DIR, "homepage-contracts-documents.png"),
        });
    });
});
