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
    await expect(page.locator('h1')).toContainText('Pick the plan that fits your household.');
});

test('calculator page loads in the browser', async ({ page }) => {
    await page.goto('/calculator', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Wage & UIF calculator');
});

test('homepage pricing CTA sends paid plans to upgrade flow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await Promise.all([
        page.waitForURL('**/upgrade**'),
        page.getByRole('link', { name: 'Choose Standard' }).click(),
    ]);
    await expect(page).toHaveURL(/\/upgrade/);
});

test('homepage "Start free" CTA sends to dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await Promise.all([
        page.waitForURL('**/dashboard'),
        page.getByRole('link', { name: 'Start free' }).first().click(),
    ]);
    await expect(page).toHaveURL(/\/dashboard$/);
});

test('support page loads', async ({ page }) => {
    await page.goto('/support', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Support & Contact');
});
