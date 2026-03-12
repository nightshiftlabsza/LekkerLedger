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
    await expect(page.getByRole("heading", { name: /Payslips and household employment records in one place\./i })).toBeVisible();
    await expect(page.getByText(/Track monthly pay, show UIF deductions clearly on payslips, and keep records available when you need them\./i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Start free/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Login (Paid users)" })).toBeVisible();
});

test("home page does not contain old fear messaging", async ({ page }) => {
    await page.goto("/");
    // These should be gone
    await expect(page.getByText("The Stakes Are Real")).not.toBeVisible();
    await expect(page.getByText("100% Legal & Private")).not.toBeVisible();
    await expect(page.getByText("Zero servers")).not.toBeVisible();
    await expect(page.getByText("Start free Check")).not.toBeVisible();
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
    await expect(page.getByText(/Set up once\. Generate payslips\. Keep the records together/i)).toBeVisible();
    await expect(page.getByText(/Not just a payslip\. Your household record trail/i)).toBeVisible();
    await expect(page.getByText(/Questions households ask before they start/i)).toBeVisible();
});

test("paid login opens an in-page auth area with inline password reset", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Login (Paid users)" }).click();

    await expect(page.getByRole("region", { name: "Paid user login area" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Paid account login" })).toBeVisible();
    await expect(page.getByText(/Password reset stays in this browser/i)).toBeVisible();

    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page.getByRole("heading", { name: "Password reset" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to paid login" })).toBeVisible();
});

