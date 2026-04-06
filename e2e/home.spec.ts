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

test("home page scrolls with wheel input", async ({ page }) => {
    await page.goto("/");
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 1200);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("home page hero shows new headline and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Get your domestic worker payslips and UIF done in minutes\./i })).toBeVisible();
    await expect(page.getByText(/Built for South African household employers who want clear pay calculations, proper payslips, and a tidy record trail when uFiling or paperwork comes up\./i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Check UIF \+ take-home pay \(free\)/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
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
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("dialog", { name: "Paid user login" })).toBeVisible();
    await expect(page.getByText("Paid account login")).toBeVisible();
    await expect(page.getByText(/Log in to restore your cloud-synced records on this device\./i)).toBeVisible();

    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page.getByText("Reset password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to login" })).toBeVisible();
});

