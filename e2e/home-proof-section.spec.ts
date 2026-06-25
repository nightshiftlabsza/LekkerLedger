import { expect, test } from "@playwright/test";

test.describe("Homepage paid proof section", () => {
    test("desktop tabs switch the active proof panel manually", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 960 });
        await page.goto("/");

        await expect(page.getByRole("heading", { name: "What paid plans add after the first payslip" })).toBeVisible();
        await page.getByRole("tab", { name: /Keep contracts with the worker record/i }).click();
        await expect(page.getByRole("link", { name: "See what paid plans include" })).toBeVisible();
    });

    test("mobile proof section uses an accordion with one shared CTA", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/");
        const proofSection = page.locator("#paid-plans");

        const contractsToggle = proofSection.getByRole("button", { name: /Keep contracts with the worker record/i });
        await contractsToggle.click();
        await expect(page.locator("#paid-proof-accordion-contracts-documents").getByText(/Find the right paperwork quickly/i)).toBeVisible();

        await expect(proofSection.getByRole("link", { name: "See full pricing" })).toBeVisible();
        await expect(proofSection.getByRole("link", { name: "See what paid plans include" })).toHaveCount(0);
    });
});
