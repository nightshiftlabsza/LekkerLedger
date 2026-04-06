import { expect, test, type Page } from "@playwright/test";

async function completeStepOne(page: Page) {
    await page.getByLabel("Worker name").fill("Thandi Maseko");
    await page.getByRole("button", { name: /Payslip details/i }).click();
    await page.getByLabel("Employer name").fill("Nomsa Dlamini");
    await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
    await page.getByRole("button", { name: "Continue to this month’s work" }).click();
}

async function completeStepTwo(page: Page) {
    await page.getByLabel("Days she came in").fill("19");
    await page.getByRole("button", { name: "Review the payslip" }).click();
}

async function reachReviewStep(page: Page) {
    await page.goto("/resources/tools/domestic-worker-payslip");
    await expect(page.getByRole("heading", { name: "Create this month's payslip" }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Her schedule and hourly rate" })).toBeVisible();
    await completeStepOne(page);
    await expect(page.getByRole("heading", { name: "How much did she work this month?" })).toBeVisible();
    await completeStepTwo(page);
    await expect(page.getByRole("heading", { name: "Review and email" })).toBeVisible();
}

test.describe("Free public payslip flow", () => {
    test("uses the new wizard flow and keeps optional fields tucked away", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");
        await expect(page.getByRole("heading", { name: "Create this month's payslip" }).first()).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole("heading", { name: "Her schedule and hourly rate" })).toBeVisible();

        await expect(page.getByLabel("Employer name")).toHaveCount(0);
        await expect(page.getByLabel("Anything deducted from her pay")).toHaveCount(0);
        await expect(page.getByText(/same browser/i)).toHaveCount(0);

        await completeStepOne(page);
        await expect(page.getByRole("heading", { name: "How much did she work this month?" })).toBeVisible();
        await expect(page.getByLabel("Total normal hours worked")).toHaveCount(0);
        await expect(page.getByLabel("Anything deducted from her pay")).toHaveCount(0);
    });

    test("updates the Sunday helper copy when the normal schedule changes", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");
        await page.getByLabel("Worker name").fill("Thandi Maseko");
        await page.getByRole("button", { name: /Other days/i }).click();
        await page.getByRole("button", { name: "Sun" }).click();
        await page.getByRole("button", { name: /Payslip details/i }).click();
        await page.getByLabel("Employer name").fill("Nomsa Dlamini");
        await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
        await page.getByRole("button", { name: "Continue to this month’s work" }).click();

        const optionalAdjustmentsButton = page.getByRole("button", { name: /Anything else\?/i });
        const sundayHoursField = page.getByLabel("Sunday hours worked");

        await optionalAdjustmentsButton.click();
        await expect(sundayHoursField).toBeVisible();
        await expect(page.getByText(/Sunday hours are paid at 1\.5x/i)).toBeVisible();

        await page.getByRole("button", { name: "Back" }).click();
        await expect(page.getByRole("heading", { name: "Her schedule and hourly rate" })).toBeVisible();
        await page.getByRole("button", { name: /Monday to Friday/i }).click();
        await page.getByRole("button", { name: "Continue to this month’s work" }).click();
        await expect(page.getByRole("heading", { name: "How much did she work this month?" })).toBeVisible();

        if (!(await sundayHoursField.isVisible())) {
            await optionalAdjustmentsButton.click();
        }

        await expect(sundayHoursField).toBeVisible();
        await expect(page.getByText(/Sunday hours are paid at 2x/i)).toBeVisible();
    });

    test("shows the new review summary and fresh checkbox state", async ({ page }) => {
        await reachReviewStep(page);

        await expect(page.getByText("Amount to pay her")).toBeVisible();
        await expect(page.getByText("UIF total")).toBeVisible();
        await expect(page.getByRole("checkbox", { name: /send me a free monthly household employer checklist and tips/i })).not.toBeChecked();
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
        await page.getByRole("button", { name: "Email my free payslip" }).click();

        const successGate = page.getByTestId("free-payslip-gate-success");
        await expect(successGate).toBeVisible();
        await expect(successGate.getByText(/✓ Payslip sent to owner@example\.com/)).toBeVisible();
        expect(deliverCount).toBe(1);
    });

    test("shows the monthly limit and service-unavailable states", async ({ page }) => {
        await page.route("**/api/free-payslip/deliver", async (route) => {
            await route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({
                    error: "This email address has already used its one successful free payslip PDF for this calendar month.",
                }),
            });
        });

        await reachReviewStep(page);
        await page.getByLabel("Email address").fill("owner@example.com");
        await page.getByRole("button", { name: "Email my free payslip" }).click();

        await expect(page.getByTestId("free-payslip-gate-quota-used")).toBeVisible();
        await expect(page.getByText("This email address has already used its one successful free payslip PDF for this calendar month.")).toBeVisible();

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
        await page.getByRole("button", { name: "Email my free payslip" }).click();

        await expect(page.getByTestId("free-payslip-gate-service-unavailable")).toBeVisible();
        await expect(page.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeVisible();
    });
});
