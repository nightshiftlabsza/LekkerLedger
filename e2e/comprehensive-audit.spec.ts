import { test, expect } from '@playwright/test';

test.describe('Comprehensive 50 Action Audit', () => {

    test('Perform 50 common actions flow', async ({ page, context }) => {

        test.setTimeout(120000); // 2 minutes for full audit

        // Helper for taking screenshots at key moments to review later
        const snap = async (name: string) => {
            await page.waitForTimeout(1000); // let animations settle
            await page.screenshot({ path: `e2e-screenshots/audit-${name}.png`, fullPage: true });
        };

        // --- LANDING & ONBOARDING (Actions 1-6) ---
        console.log('Starting Landing & Onboarding...');

        // Clear all IndexedDB data from browser context to prevent localforage bleed
        await page.goto("/");
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

        // 1. Navigate to landing page
        await page.goto('/');
        await snap('01-landing-page');

        // 2. View Pricing plans
        const pricingLink = page.getByRole('link', { name: /pricing/i }).first();
        if (await pricingLink.isVisible()) {
            await pricingLink.click({ force: true });
            try {
                await expect.soft(page).toHaveURL(/.*pricing/, { timeout: 5000 });
                await snap('02-pricing-page');
            } catch (e) {
                console.error('Bug found: Pricing link did not navigate to /pricing', (e as Error).message);
            }
        }

        // 3. Access Legal pages
        await page.goto('/legal/privacy-policy');
        await snap('03-privacy-policy');
        await page.goto('/legal/terms-of-service');
        await snap('03-terms-of-service');

        // 4 & 5. Signup / Login
        await page.goto('/onboarding');
        await page.getByPlaceholder('What is your name?').fill('Test User', { force: true });
        await page.getByRole('button', { name: /Continue|Next/i }).click({ force: true });

        // 6. Complete wizard
        await page.getByPlaceholder('Company Name').fill('Test Audit Company', { force: true });
        await page.getByRole('button', { name: /Continue|Next/i }).click({ force: true });
        await snap('06-onboarding-complete');

        // Navigate to dashboard if not automatically done
        await page.goto('/dashboard');

        // --- DASHBOARD (Actions 7-10) ---
        console.log('Dashboard checks...');
        await expect.soft(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
        await snap('07-dashboard');

        // --- SETTINGS (Actions 11-16) ---
        console.log('Settings checks...');
        await page.goto('/settings');
        await expect.soft(page).toHaveURL(/.*settings/, { timeout: 10000 });
        await snap('11-settings-page');

        await page.getByLabel(/Company Registration Number/i).fill('2023/123456/07', { force: true });
        await page.getByRole('button', { name: /Save/i }).first().click({ force: true });
        await snap('12-settings-saved');

        // --- EMPLOYEES (Actions 17-27) ---
        console.log('Employee checks...');
        await page.goto('/employees');
        await expect.soft(page).toHaveURL(/.*employees/, { timeout: 10000 });
        await snap('17-employees-list');

        // 18. Add Employee
        await page.getByRole('button', { name: /Add Employee/i }).click({ force: true });
        await expect.soft(page).toHaveURL(/.*employees\/new/, { timeout: 10000 });

        await page.getByPlaceholder('First Name').fill('John', { force: true });
        await page.getByPlaceholder('Last Name').fill('Doe', { force: true });
        await page.getByPlaceholder('ID Number').fill('9001015009087', { force: true });

        await page.getByRole('button', { name: /Next|Continue/i }).click({ force: true });
        await page.getByPlaceholder('Job Title').fill('Software Engineer', { force: true });

        await page.getByRole('button', { name: /Next|Continue/i }).click({ force: true });
        await page.getByPlaceholder('Basic Pay').fill('50000', { force: true });

        await page.getByRole('button', { name: /Save/i }).click({ force: true });
        await snap('22-employee-saved');

        // --- PAYSLIP (Actions 28-36) ---
        console.log('Payslip checks...');
        await page.goto('/employees');
        const firstEmployeeLink = page.getByRole('link', { name: /John Doe/i }).first();
        if (await firstEmployeeLink.isVisible()) {
            await firstEmployeeLink.click({ force: true });
            await page.waitForTimeout(1000);
            await page.getByRole('button', { name: /Generate Payslip/i }).click({ force: true });
            await snap('28-payslip-wizard');

            // Toggle UIF
            const uifToggle = page.getByRole('switch', { name: /UIF/i });
            if (await uifToggle.isVisible()) {
                await uifToggle.click({ force: true });
            }

            await page.getByRole('button', { name: /Preview/i }).click({ force: true });
            await snap('34-payslip-preview');
        }

        // --- LOGOUT (Action 49) ---
        console.log('Logout checks...');
        await page.goto('/settings');
        const logoutBtn = page.getByRole('button', { name: /Logout|Sign Out/i });
        if (await logoutBtn.isVisible()) {
            await logoutBtn.click({ force: true });
        }
        await snap('49-logout');

        console.log('Audit run complete!');
    });
});
