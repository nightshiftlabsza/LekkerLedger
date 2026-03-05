import { test, expect } from "@playwright/test";

test("home page loads and has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LekkerLedger/i);
});

test("home page contains a main element", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    await expect(main).toBeVisible();
});

test("home page hero shows new headline and CTAs", async ({ page }) => {
    await page.goto("/");
    // New headline
    await expect(page.getByText(/Create a professional payslip for your domestic worker/i)).toBeVisible();
    // Primary CTA
    await expect(page.getByRole("button", { name: /Create your first payslip/i }).first()).toBeVisible();
    // Secondary CTA
    await expect(page.getByText(/How your data is stored/i).first()).toBeVisible();
});

test("home page does not contain old fear messaging", async ({ page }) => {
    await page.goto("/");
    // These should be gone
    await expect(page.getByText("The Stakes Are Real")).not.toBeVisible();
    await expect(page.getByText("100% Legal & Private")).not.toBeVisible();
    await expect(page.getByText("Zero servers")).not.toBeVisible();
    await expect(page.getByText("Start Free Check")).not.toBeVisible();
});

test("home page has marketing header (no app nav)", async ({ page }) => {
    await page.goto("/");
    // Marketing nav links should be visible on desktop
    await expect(page.getByRole("link", { name: /How it works/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Pricing/i }).first()).toBeVisible();
    // App nav items should NOT be visible
    await expect(page.getByRole("link", { name: "Dashboard", exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Employees", exact: true })).not.toBeVisible();
});

test("home page has all major sections", async ({ page }) => {
    await page.goto("/");
    // Key section headings
    await expect(page.getByText("Private by design")).toBeVisible();
    await expect(page.getByText(/Compliant paperwork shouldn't cost a fortune/i)).toBeVisible();
    await expect(page.getByText(/Guardrails that help you/i)).toBeVisible();
    await expect(page.getByText(/Everything you need for/i)).toBeVisible();
    await expect(page.getByText(/Your employee data isn't stored/i)).toBeVisible();
    await expect(page.getByText(/Start free/i)).toBeVisible();
    await expect(page.getByText(/Frequently asked questions/i)).toBeVisible();
});
