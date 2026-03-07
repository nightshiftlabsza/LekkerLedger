import { test, expect } from '@playwright/test';

test('sample payslip preview is accessible', async ({ request }) => {
    const response = await request.get('/examples');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('Your employee documentation');
});

test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('Payslips, paperwork, and household payroll records in one place.');
});
