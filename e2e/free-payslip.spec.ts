import { expect, test, type Page } from "@playwright/test";

async function fillCoreFlow(page: Page) {
    await page.goto("/resources/tools/domestic-worker-payslip");
    await expect(page.getByRole("heading", { name: "Enter this month's pay details" })).toBeVisible({ timeout: 20000 });

    await page.getByLabel("Employer name").fill("Nomsa Dlamini");
    await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
    await page.getByLabel("Worker name").fill("Thandi Maseko");
    await page.getByLabel("Normal days worked").fill("19");
}

test.describe("Free public payslip flow", () => {
    test("feels like one short flow instead of a verification ritual", async ({ page }) => {
        await fillCoreFlow(page);

        await expect(page.getByText("Build the payslip step by step.")).toHaveCount(0);
        await expect(page.getByText("Details")).toHaveCount(0);
        await expect(page.getByLabel("Job title")).toHaveCount(0);
        await expect(page.getByLabel("ID or passport number")).toHaveCount(0);
        await expect(page.getByLabel("Other deductions")).toHaveCount(0);
        await expect(page.getByText(/same browser/i)).toHaveCount(0);
        await expect(page.getByRole("button", { name: "I opened the email link" })).toHaveCount(0);
        await expect(page.getByText(/maximum normal days is 19/i)).toBeVisible();
        await expect(page.getByText("Gross pay")).toBeVisible();
    });

    test("reveals extra schedule controls only when custom days is selected", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");

        await expect(page.getByRole("button", { name: "Mon" })).toHaveCount(0);
        await page.getByRole("button", { name: /Custom days/i }).click();
        await expect(page.getByRole("button", { name: "Mon" })).toBeVisible();
    });

    test("keeps optional adjustments collapsed until needed", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");

        await expect(page.getByLabel("Other deductions")).toHaveCount(0);
        await page.getByRole("button", { name: /Deductions and short shifts/i }).click();
        await expect(page.getByLabel("Other deductions")).toBeVisible();
        await expect(page.getByLabel("Short shifts under four hours")).toBeVisible();
    });

    test("emails the payslip in one step when delivery succeeds", async ({ page }) => {
        let deliverCount = 0;
        await page.route("**/api/free-payslip/deliver", async (route) => {
            deliverCount += 1;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    status: "sent",
                    email: "owner@example.com",
                    monthKey: "2026-04",
                }),
            });
        });

        await fillCoreFlow(page);
        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my free payslip" }).click();

        await expect(page.getByTestId("free-payslip-gate-success")).toBeVisible();
        await expect(page.getByText("Your payslip has been sent to owner@example.com")).toBeVisible();
        expect(deliverCount).toBe(1);
    });

    test("shows the monthly limit state cleanly", async ({ page }) => {
        await page.route("**/api/free-payslip/deliver", async (route) => {
            await route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({
                    error: "This verified email has already used its one successful free payslip PDF for this calendar month.",
                }),
            });
        });

        await fillCoreFlow(page);
        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my free payslip" }).click();

        await expect(page.getByTestId("free-payslip-gate-quota-used")).toBeVisible();
        await expect(page.getByText("This verified email has already used its one successful free payslip PDF for this calendar month.")).toBeVisible();
    });

    test("shows the service unavailable state cleanly", async ({ page }) => {
        await page.route("**/api/free-payslip/deliver", async (route) => {
            await route.fulfill({
                status: 503,
                contentType: "application/json",
                body: JSON.stringify({
                    error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
                }),
            });
        });

        await fillCoreFlow(page);
        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my free payslip" }).click();

        await expect(page.getByTestId("free-payslip-gate-service-unavailable")).toBeVisible();
        await expect(page.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeVisible();
    });
});
