import { test, expect } from '@playwright/test';

test('sample payslip PDF is accessible', async ({ request }) => {
    const response = await request.get('/sample-payslip.pdf');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
});

test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('Simple, transparent pricing');
});
