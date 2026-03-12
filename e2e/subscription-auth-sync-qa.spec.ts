import { expect, test } from "@playwright/test";

async function mockPaidSignupHandoff(page: import("@playwright/test").Page) {
    await page.route("**/api/billing/confirm", async (route) => {
        await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Sign-in is required before confirming payment." }),
        });
    });

    await page.route("**/api/billing/account", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                entitlements: {
                    planId: "free",
                    billingCycle: "monthly",
                    status: "free",
                    cancelAtPeriodEnd: false,
                    availableReferralMonths: 0,
                    pendingReferralMonths: 0,
                    isActive: false,
                },
                account: {
                    cancelAtPeriodEnd: false,
                    availableReferralMonths: 0,
                    pendingReferralMonths: 0,
                    successfulReferralCount: 0,
                    totalReferralMonthsEarned: 0,
                },
            }),
        });
    });

    await page.route("**/api/billing/guest-confirm", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                paid: true,
                email: "paid.user@example.com",
                planId: "standard",
            }),
        });
    });
}

test.describe("Subscription/Auth/Sync live QA", () => {
    test("login stays directly accessible", async ({ page }) => {
        await page.goto("/login", { waitUntil: "networkidle" });
        await expect(page.getByText("Paid access, recovery, and setup in one calm flow.")).toBeVisible();
        await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test("signup without payment shows the gating screen", async ({ page }) => {
        await page.goto("/signup", { waitUntil: "networkidle" });
        await expect(page.getByRole("heading", { name: "New cloud accounts open after payment" })).toBeVisible();
        await expect(page.getByRole("link", { name: "View plans" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Log in to restore access" })).toBeVisible();
    });

    test("signup with a paid reference unlocks the account form", async ({ page }) => {
        await page.route("**/api/billing/guest-confirm", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    paid: true,
                    email: "paid.user@example.com",
                    planId: "standard",
                }),
            });
        });

        await page.goto("/signup?reference=paid-ref&email=paid.user@example.com", { waitUntil: "networkidle" });
        await expect(page.getByRole("heading", { name: "Create your secure account" })).toBeVisible();
        await expect(page.getByLabel("Email address")).toHaveValue("paid.user@example.com");
        await expect(page.getByRole("button", { name: "Create secure account" })).toBeVisible();
    });

    test("billing success resumes a signed-out paid handoff on mobile dark mode", async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem("ll-theme", "dark");
        });
        await mockPaidSignupHandoff(page);
        await page.setViewportSize({ width: 390, height: 844 });

        await page.goto("/billing/success?reference=abc123", { waitUntil: "networkidle" });

        await expect(page.getByRole("heading", { name: "Payment confirmed. Create your account" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Create the account for this paid plan" })).toBeVisible();
        await expect(page.getByLabel("Email address")).toHaveValue("paid.user@example.com");
        await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
        await expect(page).toHaveURL(/\/billing\/success$/);

        const layout = await page.evaluate(() => {
            const doc = document.documentElement;
            const section = document.querySelector("section");
            const aside = document.querySelector("aside");
            if (!section || !aside) return null;
            const sectionRect = section.getBoundingClientRect();
            const asideRect = aside.getBoundingClientRect();
            return {
                hasOverflow: doc.scrollWidth > doc.clientWidth,
                stacked: asideRect.top > sectionRect.bottom - 20,
            };
        });

        expect(layout).not.toBeNull();
        expect(layout?.hasOverflow).toBe(false);
        expect(layout?.stacked).toBe(true);
    });

    test("billing success uses a side panel cleanly on ultrawide screens", async ({ page }) => {
        await mockPaidSignupHandoff(page);
        await page.setViewportSize({ width: 1728, height: 960 });

        await page.goto("/billing/success?reference=wide-abc", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("What happens next")).toBeVisible();
        await expect(page).toHaveURL(/\/billing\/success$/);

        const layout = await page.evaluate(() => {
            const section = document.querySelector("section");
            const aside = document.querySelector("aside");
            const doc = document.documentElement;
            if (!section || !aside) return null;
            const sectionRect = section.getBoundingClientRect();
            const asideRect = aside.getBoundingClientRect();
            return {
                hasOverflow: doc.scrollWidth > doc.clientWidth,
                sameRow: Math.abs(sectionRect.top - asideRect.top) < 40,
                asideToRight: asideRect.left > sectionRect.left,
            };
        });

        expect(layout).not.toBeNull();
        expect(layout?.hasOverflow).toBe(false);
        expect(layout?.sameRow).toBe(true);
        expect(layout?.asideToRight).toBe(true);
    });

    test("settings storage tab remains readable on mobile", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/settings?tab=storage", { waitUntil: "networkidle" });
        await expect(page.getByRole("heading", { name: "Encrypted Sync" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Storage Rules" })).toBeVisible();

        const layout = await page.evaluate(() => {
            const doc = document.documentElement;
            return {
                hasOverflow: doc.scrollWidth > doc.clientWidth,
            };
        });

        expect(layout.hasOverflow).toBe(false);
    });
});
