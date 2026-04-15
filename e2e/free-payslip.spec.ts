import { expect, test, type Page } from "@playwright/test";

async function completeStepOne(page: Page) {
    await page.getByLabel("Worker name").fill("Thandi Maseko");
    await page.getByRole("button", { name: /Payslip details/i }).click();
    await page.getByLabel("Employer name").fill("Nomsa Dlamini");
    await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
    await page.getByRole("button", { name: "Continue to this month's work" }).click();
}

async function completeStepTwo(page: Page) {
    await page.getByRole("button", { name: "No, standard month" }).click();
    await page.getByRole("button", { name: "Review the payslip" }).click();
}

async function reachReviewStep(page: Page) {
    await page.goto("/resources/tools/domestic-worker-payslip");
    await expect(page.getByRole("heading", { name: "Free Domestic Worker Payslip Template & Generator" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Schedule and hourly rate" })).toBeVisible();
    await completeStepOne(page);
    await expect(page.getByRole("heading", { name: /Normal month for/i })).toBeVisible();
    await completeStepTwo(page);
    await expect(page.getByRole("heading", { name: "Review and email" })).toBeVisible();
}

test.describe("Free public payslip flow", () => {
    test("uses the new wizard flow and keeps optional fields tucked away", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");
        await expect(page.getByRole("heading", { name: "Free Domestic Worker Payslip Template & Generator" })).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole("heading", { name: "Schedule and hourly rate" })).toBeVisible();

        await expect(page.getByLabel("Employer name")).toHaveCount(0);
        await expect(page.getByLabel("Days they missed")).toHaveCount(0);
        await expect(page.getByLabel("How many short days?")).toHaveCount(0);
        await expect(page.getByLabel("Hours worked on public holidays")).toHaveCount(0);

        await completeStepOne(page);
        await expect(page.getByRole("heading", { name: /Normal month for/i })).toBeVisible();
        await expect(page.getByLabel("Days they missed")).toHaveCount(0);
        await expect(page.getByLabel("How many short days?")).toHaveCount(0);
        await expect(page.getByLabel("Hours worked on public holidays")).toHaveCount(0);
        await expect(page.getByRole("button", { name: /See .* public holidays/i })).toBeVisible();
    });

    test("shows the Sunday helper and public-holiday helper copy", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");
        await page.getByLabel("Worker name").fill("Thandi Maseko");
        await page.getByRole("button", { name: /Other days/i }).click();
        await page.getByRole("button", { name: "Sun" }).click();
        await page.getByRole("button", { name: /Payslip details/i }).click();
        await page.getByLabel("Employer name").fill("Nomsa Dlamini");
        await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
        await page.getByRole("button", { name: "Continue to this month's work" }).click();

        await page.getByRole("button", { name: "Yes, I need to make adjustments" }).click();
        const publicHolidayGroup = page.getByRole("group", { name: /Did the worker work on any South African public holidays this month\?/i });
        await publicHolidayGroup.getByRole("button", { name: "Yes" }).click();
        await expect(page.getByLabel("Hours worked on public holidays")).toBeVisible();
        await page.getByRole("button", { name: /See .* public holidays/i }).click();
        await expect(page.getByText("Good Friday")).toBeVisible();

        await page.getByRole("button", { name: "Back" }).click();
        await expect(page.getByRole("heading", { name: "Schedule and hourly rate" })).toBeVisible();
        await page.getByRole("button", { name: /Monday to Friday/i }).click();
        await page.getByRole("button", { name: "Continue to this month's work" }).click();
        await expect(page.getByRole("heading", { name: /Normal month for/i })).toBeVisible();

        await page.getByRole("button", { name: "Yes, I need to make adjustments" }).click();
        const sundayGroup = page.getByRole("group", { name: /Did the worker work on a Sunday\?/i });
        await sundayGroup.getByRole("button", { name: "Yes" }).click();
        await expect(page.getByLabel("Sunday hours")).toBeVisible();
        await page.getByRole("button", { name: "Show Sunday pay rule" }).click();
        await expect(page.getByText(/2x the normal hourly rate/i)).toBeVisible();
    });

    test("shows the new review summary and fresh checkbox state", async ({ page }) => {
        await reachReviewStep(page);

        await expect(page.getByText("Amount to pay")).toBeVisible();
        await expect(page.getByText("UIF total")).toBeVisible();
        await expect(page.getByRole("checkbox", { name: /send me household employer updates and tips/i })).not.toBeChecked();
    });

    test("emails the payslip when delivery succeeds", async ({ page }) => {
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

        await reachReviewStep(page);
        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my first payslip free" }).click();

        const successGate = page.getByTestId("free-payslip-gate-success");
        await expect(successGate).toBeVisible();
        await expect(successGate.getByText(/✓ Your free sample was emailed to owner@example\.com/)).toBeVisible();
        expect(deliverCount).toBe(1);
    });

    test("shows the monthly limit and service-unavailable states", async ({ page }) => {
        await page.route("**/api/free-payslip/deliver", async (route) => {
            await route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({
                    error: "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.",
                }),
        });
        });

        await reachReviewStep(page);
        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my first payslip free" }).click();

        await expect(page.getByTestId("free-payslip-gate-already-used")).toBeVisible();
        await expect(page.getByText("This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.")).toBeVisible();

        await page.unroute("**/api/free-payslip/deliver");
        await page.route("**/api/free-payslip/deliver", async (route) => {
            await route.fulfill({
                status: 503,
                contentType: "application/json",
                body: JSON.stringify({
                    error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
                }),
            });
        });

        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my first payslip free" }).click();

        await expect(page.getByTestId("free-payslip-gate-service-unavailable")).toBeVisible();
        await expect(page.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeVisible();
    });
});
