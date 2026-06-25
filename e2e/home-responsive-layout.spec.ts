import { expect, test } from "@playwright/test";

const VIEWPORTS = [
    { width: 320, height: 900 },
    { width: 360, height: 900 },
    { width: 375, height: 900 },
    { width: 390, height: 900 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 480, height: 960 },
    { width: 640, height: 960 },
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
    { width: 1024, height: 1100 },
    { width: 1280, height: 1200 },
    { width: 1440, height: 1200 },
    { width: 1728, height: 1200 },
    { width: 1920, height: 1280 },
    { width: 2560, height: 1400 },
] as const;

test.describe("Homepage responsive layout", () => {
    for (const viewport of VIEWPORTS) {
        test(`stays readable at ${viewport.width}px`, async ({ page }) => {
            await page.setViewportSize(viewport);
            await page.goto("/");

            await expect(page.getByRole("heading", { name: /Domestic worker payslips and UIF for South African households/i })).toBeVisible();
            await expect(page.getByTestId("sample-payslip-card")).toBeVisible();

            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 4);
            expect(overflow).toBe(false);

            const proofSection = page.locator("#paid-plans");
            await proofSection.scrollIntoViewIfNeeded();
            await expect(proofSection.getByRole("heading", { name: "What paid plans add after the first payslip" })).toBeVisible();

            if (viewport.width >= 1024) {
                await expect(proofSection.getByRole("tab", { name: /Keep contracts with the worker record/i })).toBeVisible();
            } else {
                const accordionToggle = proofSection.getByRole("button", { name: /Keep contracts with the worker record/i });
                await expect(accordionToggle).toBeVisible();
                await accordionToggle.click();
                await expect(page.locator("#paid-proof-accordion-contracts-documents")).toBeVisible();
            }

            const pricingSection = page.locator("#pricing-preview");
            await pricingSection.scrollIntoViewIfNeeded();
            await expect(pricingSection.getByText("Before you pay")).toBeVisible();
            await expect(pricingSection.getByText("Why this exists")).toBeVisible();
        });
    }
});
