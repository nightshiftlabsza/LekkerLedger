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

        // 1.5 Setup Employer Details (Now required for payslip generation)
        await page.goto("/settings");
        await page.fill('input[id="ename"]', "Test Employer");
        await page.fill('input[id="eaddr"]', "123 Test St, Cape Town");
        await page.click('button:has-text("Save Changes")');
        // Wait for potential toast or just small timeout
        await page.waitForTimeout(1000);

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

        // 5. Navigate to Employee Details and then to Wizard
        const employeeRow = page.locator('tr').filter({ hasText: 'Test Worker' }).first();
        await employeeRow.locator('a[href*="/employees/"]').first().click({ force: true });
        await page.waitForLoadState('networkidle');

        // Ensure the Pay History tab is visible and clickable
        const payHistoryTab = page.locator('button').filter({ hasText: /Pay History/i });
        await payHistoryTab.waitFor({ state: 'visible' });
        await payHistoryTab.click({ force: true });

        // Wait for tab content
        const createPayslipBtn = page.getByRole('button', { name: /Create Payslip|Add Payslip/i });
        await createPayslipBtn.waitFor({ state: 'visible', timeout: 10000 });
        await createPayslipBtn.click({ force: true });

        // 6. We should be on the Wizard
        await expect(page).toHaveURL(/\/wizard/, { timeout: 10000 });
        await page.waitForSelector('input[id="month"]');

        // Fill monthly standard-time flow
        await page.fill('input[id="month"]', "2025-01");
        await page.fill('input[id="standardWorkingDays"]', "22");

        // Next -> Sundays & Holidays
        await page.getByRole('button', { name: /Next/i }).first().click({ force: true });
        await page.waitForTimeout(500);

        // Next -> Deductions
        await page.getByRole('button', { name: /Next/i }).first().click({ force: true });
        await page.waitForTimeout(500);

        // Toggle Accommodation
        await page.getByText('Accommodation Deduction').click({ force: true });
        await page.fill('input[id="accommodationCost"]', "500");

        // Next -> Review
        await page.getByRole('button', { name: /Next/i }).first().click({ force: true });
        await page.waitForTimeout(500);

        // Check review page contains net pay
        await expect(page.locator('text=Net Pay')).toBeVisible();

        // Save & Preview
        await page.getByRole('button', { name: /Save & Preview/i }).first().click({ force: true });

        // 7. Verify we ended up on the Preview page
        await expect(page).toHaveURL(/\/preview/, { timeout: 10000 });

        await expect(page.locator('text=Payslip ready to review')).toHaveCount(0);

        // Check if the Download button exists
        const downloadBtn = page.locator('button:has-text("Download PDF")').first();
        await expect(downloadBtn).toBeVisible();
    });
});
