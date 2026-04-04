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

async function fillCoreFlow(page: Page) {
    await page.goto("/resources/tools/domestic-worker-payslip");
    await expect(page.getByRole("heading", { name: "Fill in a few obvious details." })).toBeVisible({ timeout: 20000 });

    await page.getByLabel("Employer name").fill("Nomsa Dlamini");
    await page.getByLabel("Employer address").fill("18 Acacia Avenue, Northcliff, Johannesburg");
    await page.getByLabel("Worker name").fill("Thandi Maseko");
    await page.getByLabel("Normal days worked").fill("19");
}

test.describe("Free public payslip flow", () => {
    test("feels like one short flow instead of a wizard", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        await fillCoreFlow(page);

        await expect(page.getByText("Build the payslip step by step.")).toHaveCount(0);
        await expect(page.getByText("Details")).toHaveCount(0);
        await expect(page.getByText("Extra pay")).toHaveCount(0);
        await expect(page.getByText("Review")).toHaveCount(0);
        await expect(page.getByLabel("Worker role")).toHaveCount(0);
        await expect(page.getByLabel("ID or passport number")).toHaveCount(0);
        await expect(page.getByLabel("Other deductions")).toHaveCount(0);
        await expect(page.getByText(/maximum normal days is 19/i)).toBeVisible();
        await expect(page.getByText("Gross pay")).toBeVisible();
    });

    test("reveals extra schedule controls only when custom days is selected", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        await page.goto("/resources/tools/domestic-worker-payslip");

        await expect(page.getByRole("button", { name: "Mon" })).toHaveCount(0);
        await page.getByRole("button", { name: /Custom days/i }).click();
        await expect(page.getByRole("button", { name: "Mon" })).toBeVisible();
    });

    test("keeps optional adjustments collapsed until needed", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        await page.goto("/resources/tools/domestic-worker-payslip");

        await expect(page.getByLabel("Other deductions")).toHaveCount(0);
        await page.getByRole("button", { name: /Optional adjustments/i }).click();
        await expect(page.getByLabel("Other deductions")).toBeVisible();
        await expect(page.getByLabel("Short shifts under four hours")).toBeVisible();
    });

    test("moves from email entry to waiting state after sending the unlock link", async ({ page }) => {
        await mockSupabasePublicAuth(page);
        await fillCoreFlow(page);

        await page.getByLabel("Email for the unlock link").fill("owner@example.com");
        await page.getByRole("button", { name: "Send unlock link" }).click();

        await expect(page.getByTestId("free-payslip-gate-waiting-for-verification")).toBeVisible();
        await expect(page.getByText(/Unlock link sent\./)).toBeVisible();
        await expect(page.getByRole("button", { name: "I opened the link in this browser" })).toBeVisible();
    });

    test("returns through the callback, checks quota, and downloads successfully", async ({ page }) => {
        await mockSupabasePublicAuth(page);

        let quotaGetCount = 0;
        let quotaPostCount = 0;

        await page.route("**/api/free-payslip/quota", async (route) => {
            if (route.request().method() === "GET") {
                quotaGetCount += 1;
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

        await fillCoreFlow(page);
        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=success");

        await expect(page.getByTestId("free-payslip-gate-verified-ready")).toBeVisible();
        await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
        expect(quotaGetCount).toBeGreaterThan(0);

        await page.getByRole("button", { name: "Download PDF" }).click();

        await expect(page.getByTestId("free-payslip-gate-success")).toBeVisible();
        expect(quotaPostCount).toBe(1);
    });

    test("shows recovery and quota-used states clearly", async ({ page }) => {
        await mockSupabasePublicAuth(page);

        await fillCoreFlow(page);
        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=invalid-link");
        await expect(page.getByText("That verification link is invalid or expired. Send a new link to continue.")).toBeVisible();

        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=missing-session");
        await expect(page.getByText(/We could not confirm this email in this browser yet\./)).toBeVisible();

        await page.route("**/api/free-payslip/quota", async (route) => {
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

        await page.goto("/resources/tools/domestic-worker-payslip?freePayslipVerification=success");
        await expect(page.getByTestId("free-payslip-gate-quota-used")).toBeVisible();
        await expect(page.getByText("This verified email has already used its free PDF for this calendar month.")).toBeVisible();
    });
});
