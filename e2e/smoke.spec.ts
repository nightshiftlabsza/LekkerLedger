import { test, expect } from '@playwright/test';

test('sample payslip preview is accessible', async ({ request }) => {
    const response = await request.get('/examples');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('data-testid="examples-hero"');
});

test('examples page renders in the browser', async ({ page }) => {
    await page.goto('/examples', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('examples-hero')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
});

test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Pricing for domestic worker payslips, UIF, and payroll records');
});

test('calculator page loads in the browser', async ({ page }) => {
    await page.goto('/calculator', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Wage & UIF calculator');
});

test('homepage pricing CTA opens the paid checkout dialog', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Choose Standard/i }).click();
    await expect(page.getByRole('heading', { name: 'Enter your email to continue' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to secure payment' })).toBeVisible();
});

test('homepage "Email yourself a payslip PDF" CTA sends to the free payslip generator', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await Promise.all([
        page.waitForURL('**/resources/tools/domestic-worker-payslip'),
        page.getByRole('link', { name: 'Email yourself a payslip PDF (free—1/month)' }).click(),
    ]);
    await expect(page).toHaveURL(/\/resources\/tools\/domestic-worker-payslip$/);
});

test('support page loads', async ({ page }) => {
    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Support & Contact');
});
