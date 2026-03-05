import { test, expect } from "@playwright/test";

test.describe("Payslip Generation Flow", () => {
    test("user can create an employee and generate a payslip", async ({ page }) => {
        // Force desktop viewport so the side drawer stays collapsed
        await page.setViewportSize({ width: 1280, height: 800 });

        // Clear all IndexedDB data from browser context before hitting the app
        // Clear all IndexedDB data from browser context to prevent localforage bleed
        await page.goto("/");
        await expect(page).toHaveTitle(/LekkerLedger/i);

        await page.evaluate(async () => {
            const dbs = await indexedDB.databases();
            await Promise.all(dbs.map(db => {
                if (!db.name) return;
                return new Promise<void>((resolve) => {
                    const req = indexedDB.deleteDatabase(db.name!);
                    req.onsuccess = () => resolve();
                    req.onerror = () => resolve();
                    req.onblocked = () => resolve();
                });
            }));
        });

        // 1. Go to homepage fresh
        await page.goto("/");
        await expect(page).toHaveTitle(/Next|LekkerLedger/i);

        // 2. Head directly to employees/new
        await page.goto("/employees/new");
        // Wait for limit check to complete so canAdd is settled
        await page.waitForTimeout(1000);

        // 3. Fill out the employee form
        await page.fill('input[id="name"]', "Test Worker");
        await page.fill('input[id="role"]', "Gardener");
        await page.locator('input[id="hourlyRate"]').fill("35");
        await page.click('button:has-text("Save Employee")');

        // 4. Verify we are on employees page and the new employee is there
        await expect(page).toHaveURL(/\/employees/, { timeout: 10000 });
        const employeeCard = page.locator('text=Test Worker').first();
        await expect(employeeCard).toBeVisible();

        // 5. Click Payslip button
        await page.locator('button:has-text("Payslip")').first().click();

        // 6. We should be on the Wizard
        await expect(page).toHaveURL(/\/wizard/, { timeout: 10000 });
        await page.waitForSelector('input[id="start"]');

        // Fill dates
        await page.fill('input[id="start"]', "2025-01-01");
        await page.fill('input[id="end"]', "2025-01-31");

        // Fill days worked and hours
        await page.fill('input[id="daysWorked"]', "22");
        await page.fill('input[id="ordinary"]', "176");

        // Next -> Sundays & Holidays
        await page.locator('button:has-text("Next")').first().click();

        // Next -> Deductions
        await page.locator('button:has-text("Next")').first().click();

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
        await expect(page).toHaveURL(/\/preview/, { timeout: 10000 });

        // Verify PDF success message
        const successMessage = page.locator('text=Payslip generated for');
        await expect(successMessage).toBeVisible({ timeout: 10000 });

        // Check if the Download button exists
        const downloadBtn = page.locator('button:has-text("Download PDF")');
        await expect(downloadBtn).toBeVisible();
    });
});
