import { test, expect } from "@playwright/test";

test.describe("Payslip Generation Flow", () => {
    test("user can create an employee and generate a payslip", async ({ page }) => {
        // 1. Go to homepage
        await page.goto("/");
        await expect(page).toHaveTitle(/Next|LekkerLedger/i);

        // 2. Head to employees
        await page.click("text=Get Started");

        // Because of the onboarding flow check, we might go to /onboarding instead of /employees. 
        // Let's just navigate directly to /employees/new to ensure we can create one.
        await page.goto("/employees/new");

        // 3. Fill out the employee form
        await page.fill('input[id="name"]', "Test Worker");
        await page.fill('input[id="role"]', "Gardener");
        await page.fill('input[id="hourlyRate"]', "35");
        await page.click('button:has-text("Save Employee")');

        // 4. Verify we are on employees page and the new employee is there
        await expect(page).toHaveURL(/\/employees/);
        const employeeCard = page.locator('text=Test Worker');
        await expect(employeeCard).toBeVisible();

        // 5. Click Payslip button using the specific text/icon
        await page.locator('button:has-text("Payslip")').first().click();

        // 6. We should be on the Wizard. Fill out ordinary hours
        await expect(page).toHaveURL(/\/wizard/);

        // Wait for inputs to be visible
        await page.waitForSelector('input[id="start"]');

        // Fill dates
        await page.fill('input[id="start"]', "2025-01-01");
        await page.fill('input[id="end"]', "2025-01-31");

        // Fill days worked and hours
        await page.fill('input[id="daysWorked"]', "22");
        await page.fill('input[id="ordinary"]', "176");

        // Next -> Sundays & Holidays
        await page.click('button:has-text("Next")');

        // Next -> Deductions
        await page.click('button:has-text("Next")');

        // Toggle Accommodation
        await page.click('text=Accommodation Deduction');
        await page.fill('input[id="accommodationCost"]', "500");

        // Next -> Review
        await page.click('button:has-text("Next")');

        // Check review page contains net pay
        await expect(page.locator('text=Net Pay')).toBeVisible();

        // Save & Preview
        await page.click('button:has-text("Save & Preview")');

        // 7. Verify we ended up on the Preview page
        await expect(page).toHaveURL(/\/preview/);

        // Verify PDF success message
        const successMessage = page.locator('text=Payslip generated successfully for');
        await expect(successMessage).toBeVisible();

        // Check if the Download button exists
        const downloadBtn = page.locator('button:has-text("Download PDF")');
        await expect(downloadBtn).toBeVisible();
    });
});
