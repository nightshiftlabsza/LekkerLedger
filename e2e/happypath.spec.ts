import { test, expect } from "@playwright/test";

test.describe("LekkerLedger Happy Path", () => {
  test("User can create an employee and navigate wizard to generate a payslip", async ({
    page,
  }) => {
    // 1. Landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/LekkerLedger/);

    // 2. Click Manage Employees
    await page.getByRole("link", { name: /Manage Employees/i }).click();
    await expect(page).toHaveURL(/\/employees/);

    // 3. Navigate to Add Employee
    await page.getByRole("link", { name: /Add/i }).first().click();
    await expect(page).toHaveURL(/\/employees\/new/);

    // 4. Fill in the New Employee form
    await page.fill("input#name", "John Doe");
    await page.fill("input#idNumber", "9001015009087");

    // Set an illegal rate, button should be disabled
    await page.fill("input#hourlyRate", "20.00");
    const submitBtn = page.locator("button[type=submit]");
    await expect(submitBtn).toBeDisabled();

    // Set a legal rate
    await page.fill("input#hourlyRate", "35.00");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 5. Confirm redirect to employee list with new employee visible
    await expect(page).toHaveURL(/\/employees/);
    await expect(page.locator("text=John Doe")).toBeVisible();

    // 6. Navigate to wizard - click "Create Payslip" link (desktop button)
    await page
      .getByRole("link", { name: /Payslip/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/wizard/);

    // 7. Wizard: Step 1 - Hours
    await page.fill("input#ordinary", "160");
    await page.getByRole("button", { name: /Next Step/i }).click();

    // 8. Step 2 - Sundays & Holidays
    await page.fill("input#sunday", "0");
    await page.getByRole("button", { name: /Next Step/i }).click();

    // 9. Step 3 - Deductions
    // UIF status label should be visible
    await expect(page.locator("text=Currently: Active")).toBeVisible();
    await page.getByRole("button", { name: /Next Step/i }).click();

    // 10. Step 4 - Review
    await expect(page.locator("text=Payslip Summary")).toBeVisible();
    // Gross: 160 * 35 = 5600, UIF = 56, Net = 5544
    await expect(page.locator("text=5544.00")).toBeVisible();

    // 11. Generate & go to preview
    await page.getByRole("button", { name: /Save & Preview/i }).click();
    await expect(page).toHaveURL(/\/preview/);
    await expect(page.locator("text=Payslip Overview")).toBeVisible();
    await expect(page.locator("text=John Doe")).toBeVisible();

    // 12. Download button should exist
    await expect(
      page.getByRole("button", { name: /Download PDF/i }),
    ).toBeVisible();
  });
});
