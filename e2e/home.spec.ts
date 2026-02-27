import { test, expect } from "@playwright/test";

test("home page loads and has LekkerLedger title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/LekkerLedger/i);
});

test("home page contains a main element with CTA", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main");
  await expect(main).toBeVisible();
  // The landing page CTA button should be visible
  await expect(
    page.getByRole("link", { name: /Manage Employees/i }),
  ).toBeVisible();
});
