import { expect, test, type Page } from "@playwright/test";

const supabaseCorsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, x-client-info, content-type, prefer",
};

async function mockSupabasePublicAuth(page: Page) {
    await page.route("**/auth/v1/user*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
            return;
        }

        await route.fulfill({
            status: 401,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify({ message: "Auth session missing!" }),
        });
    });

    await page.route("**/auth/v1/otp*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify({}),
        });
    });

    await page.route("**/auth/v1/logout*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify({}),
        });
    });
}

async function completeWizardToReview(page: Page) {
    await page.goto("/resources/tools/domestic-worker-payslip");
    await expect(page.getByRole("heading", { name: "Create free payslip PDF" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Before you start")).toHaveCount(0);
    await expect(page.getByText("Start payslip")).toHaveCount(0);
    await expect(page.getByText("Create this month's payslip step by step")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(1);
    await page.getByLabel("Employer name").fill("Nomsa Dlamini");
    await page.getByLabel("Worker name").fill("Thandi Maseko");
    await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Set the month and ordinary time")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Back" })).toHaveCount(1);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Add overtime and premium hours")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Add any agreed deductions")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Review and generate the PDF")).toBeVisible();
}

async function simulateSameDeviceCallback(page: Page, email: string) {
    await page.goto(
        `/resources/tools/domestic-worker-payslip?freePayslipVerification=success&verifiedEmail=${encodeURIComponent(email)}`,
    );
}

test.describe("Free public payslip flow", () => {
    test("moves from email entry to waiting state after sending the verification link", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        await completeWizardToReview(page);

        await page.getByPlaceholder("you@example.com").fill("owner@example.com");
        await page.getByRole("button", { name: "Send verification link" }).click();

        await expect(page.getByTestId("free-payslip-gate-waiting")).toBeVisible();
        await expect(page.getByText("Verification link sent. Open it in the same browser where this form is open")).toBeVisible();
        await expect(page.getByRole("button", { name: "I opened the link in this browser" })).toBeVisible();
    });

    test("returns through the callback, checks quota, and downloads successfully", async ({ page }) => {
        await mockSupabasePublicAuth(page);

        let quotaGetCount = 0;
        let quotaPostCount = 0;
        let callbackCompleted = false;

        await page.route("**/api/free-payslip/quota", async (route) => {
            if (route.request().method() === "GET") {
                quotaGetCount += 1;

                if (!callbackCompleted) {
                    await route.fulfill({
                        status: 401,
                        contentType: "application/json",
                        body: JSON.stringify({ error: "Verification required." }),
                    });
                    return;
                }

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        email: "owner@example.com",
                        monthKey: "2026-03",
                        downloadsUsed: 0,
                        remainingDownloads: 1,
                        usedThisMonth: false,
                    }),
                });
                return;
            }

            quotaPostCount += 1;
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    email: "owner@example.com",
                    monthKey: "2026-03",
                    downloadsUsed: 1,
                    remainingDownloads: 0,
                    usedThisMonth: true,
                }),
            });
        });

        await completeWizardToReview(page);
        await page.getByPlaceholder("you@example.com").fill("owner@example.com");

        callbackCompleted = true;
        await simulateSameDeviceCallback(page, "owner@example.com");

        await expect(page.getByTestId("free-payslip-gate-verified")).toBeVisible();
        await expect(page.getByText("Verified as")).toContainText("owner@example.com");
        expect(quotaGetCount).toBeGreaterThan(0);

        await page.getByRole("button", { name: "Generate payslip PDF" }).click();

        await expect(page.getByTestId("free-payslip-gate-success")).toBeVisible();
        await expect(page.getByText("Want this saved and ready next month?")).toBeVisible();
        expect(quotaPostCount).toBe(1);
    });

    test("lets the user clear the verified email and start again with a different one", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        let callbackCompleted = false;

        await page.route("**/api/free-payslip/quota", async (route) => {
            if (!callbackCompleted) {
                await route.fulfill({
                    status: 401,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "Verification required." }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    email: "owner@example.com",
                    monthKey: "2026-03",
                    downloadsUsed: 0,
                    remainingDownloads: 1,
                    usedThisMonth: false,
                }),
            });
        });

        await completeWizardToReview(page);
        await page.getByPlaceholder("you@example.com").fill("owner@example.com");
        callbackCompleted = true;
        await simulateSameDeviceCallback(page, "owner@example.com");

        await expect(page.getByTestId("free-payslip-gate-verified")).toBeVisible();
        await page.getByRole("button", { name: "Use a different email" }).click();

        await expect(page.getByTestId("free-payslip-gate-unverified")).toBeVisible();
        await expect(page.getByPlaceholder("you@example.com")).toHaveValue("");
    });

    test("shows the right recovery message when the callback link is invalid or the session is still missing", async ({ page }) => {
        await mockSupabasePublicAuth(page);

        await completeWizardToReview(page);
        await page.getByPlaceholder("you@example.com").fill("owner@example.com");

        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=invalid-link");
        await expect(page.getByText("That link is invalid or expired.")).toBeVisible();

        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=missing-session");
        await expect(page.getByText("We could not confirm this email in this browser yet.")).toBeVisible();
    });

    test("shows a temporary service message instead of asking for verification again when quota lookup fails", async ({ page }) => {
        await mockSupabasePublicAuth(page);

        await page.route("**/api/free-payslip/quota", async (route) => {
            await route.fulfill({
                status: 503,
                contentType: "application/json",
                body: JSON.stringify({ error: "Cloudflare D1 query failed." }),
            });
        });

        await completeWizardToReview(page);
        await page.getByPlaceholder("you@example.com").fill("owner@example.com");
        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=success");

        await expect(page.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeVisible();
    });

    test("shows the quota-used state after verification when this month's free PDF is already used", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        let callbackCompleted = false;

        await page.route("**/api/free-payslip/quota", async (route) => {
            if (!callbackCompleted) {
                await route.fulfill({
                    status: 401,
                    contentType: "application/json",
                    body: JSON.stringify({ error: "Verification required." }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    email: "owner@example.com",
                    monthKey: "2026-03",
                    downloadsUsed: 1,
                    remainingDownloads: 0,
                    usedThisMonth: true,
                }),
            });
        });

        await completeWizardToReview(page);
        await page.getByPlaceholder("you@example.com").fill("owner@example.com");
        callbackCompleted = true;
        await simulateSameDeviceCallback(page, "owner@example.com");

        await expect(page.getByTestId("free-payslip-gate-quota-used")).toBeVisible();
        await expect(page.getByText("This verified email has already used its free PDF for this month.")).toBeVisible();
        await expect(page.getByText("Want this saved and ready next month?")).toBeVisible();
    });

    test("stays single-column on phone without horizontal overflow", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/resources/tools/domestic-worker-payslip");

        await expect(page.getByRole("heading", { name: "Create free payslip PDF" })).toBeVisible({ timeout: 20000 });
        await expect(page.getByText("Before you start")).toHaveCount(0);
        await expect(page.getByText("Start payslip")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(1);

        const metrics = await page.evaluate(() => ({
            bodyOverflowing: document.body.scrollWidth > window.innerWidth + 1,
            widePanels: Array.from(document.querySelectorAll<HTMLElement>("section, main")).some(
                (element) => element.scrollWidth > window.innerWidth + 1,
            ),
        }));

        expect(metrics.bodyOverflowing).toBe(false);
        expect(metrics.widePanels).toBe(false);
    });
});
