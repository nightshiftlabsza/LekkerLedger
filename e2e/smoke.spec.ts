import { test, expect } from '@playwright/test';

test('sample payslip preview is accessible', async ({ request }) => {
    const response = await request.get('/examples');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('Your employee documentation');
});

test('examples page renders in the browser', async ({ page }) => {
    await page.goto('/examples');
    await expect(page.locator('h1')).toContainText('Your employee documentation');
});

test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('Payslips, paperwork, and household payroll records in one place.');
});

test('calculator page loads in the browser', async ({ page }) => {
    await page.goto('/calculator');
    await expect(page.locator('h1')).toContainText('Wage & UIF calculator');
});

test('homepage storage link opens the storage explainer', async ({ page }) => {
    await page.goto('/');
    await Promise.all([
        page.waitForURL('**/storage'),
        page.getByRole('link', { name: 'How storage works' }).first().click(),
    ]);
    await expect(page).toHaveURL(/\/storage$/);
});
