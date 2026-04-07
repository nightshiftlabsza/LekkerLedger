import { expect, test } from "@playwright/test";
import { collectAuditMetrics } from "./audit/helpers";

const pricingViewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1728, height: 1117 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
];

test("pricing page copy and free CTA stay on the intended route", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });

    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "Pricing for domestic worker payslips, UIF, and payroll records",
        }),
    ).toBeVisible();
    await expect(
        page.getByText("Choose Pro only if you need more storage, more history, or multiple households"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose Standard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose Pro" })).toBeVisible();

    await Promise.all([
        page.waitForURL("**/resources/tools/domestic-worker-payslip"),
        page.getByRole("button", { name: "Start free" }).click(),
    ]);

    await expect(page).toHaveURL(/\/resources\/tools\/domestic-worker-payslip$/);
});

for (const viewport of pricingViewports) {
    test(`pricing page stays stable at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto("/pricing", { waitUntil: "domcontentloaded" });
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: "Pricing for domestic worker payslips, UIF, and payroll records",
            }),
        ).toBeVisible();
        await expect(page.getByRole("button", { name: /Monthly/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /Yearly/i })).toBeVisible();
        await expect(page.getByRole("button", { name: "Start free" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Choose Standard" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Choose Pro" })).toBeVisible();
        await expect(page.getByText("Cloud-secured storage").first()).toBeVisible();

        const metrics = await collectAuditMetrics(page);
        expect(metrics.overflow).toBe(false);
        expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 4);
    });
}
