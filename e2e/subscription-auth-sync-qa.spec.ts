import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mdqzuspgjstzliodzyzy.supabase.co";
const supabaseProjectRef = new URL(supabaseUrl).hostname.split(".")[0];
const supabaseStorageKey = `sb-${supabaseProjectRef}-auth-token`;
const supabaseCorsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, x-client-info, content-type, prefer",
};

function encodeBase64Url(value: string) {
    return Buffer.from(value, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function createFakeJwt(userId: string, email: string, expiresAt: number) {
    const header = encodeBase64Url(JSON.stringify({
        alg: "HS256",
        typ: "JWT",
    }));
    const payload = encodeBase64Url(JSON.stringify({
        aud: "authenticated",
        sub: userId,
        email,
        role: "authenticated",
        aal: "aal1",
        exp: expiresAt,
    }));
    return `${header}.${payload}.test-signature`;
}

function buildFakeSupabaseSession() {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const user = {
        id: "recovery-user-1",
        aud: "authenticated",
        role: "authenticated",
        email: "paid.user@example.com",
        email_confirmed_at: "2026-03-13T08:00:00.000Z",
        phone: "",
        confirmation_sent_at: "2026-03-13T08:00:00.000Z",
        app_metadata: {
            provider: "email",
            providers: ["email"],
        },
        user_metadata: {},
        identities: [],
        created_at: "2026-03-13T08:00:00.000Z",
        updated_at: "2026-03-13T08:00:00.000Z",
        is_anonymous: false,
    };

    return {
        access_token: createFakeJwt(user.id, user.email, expiresAt),
        refresh_token: "fake-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: expiresAt,
        user,
    };
}

async function clearSupabaseBrowserState(page: import("@playwright/test").Page) {
    await page.context().clearCookies();
    await page.addInitScript((storageKey) => {
        window.localStorage.removeItem(storageKey);
        document.cookie = `${storageKey}=; Max-Age=0; path=/`;
    }, supabaseStorageKey);
}

async function mockFirstDeviceRecoveryFlow(page: import("@playwright/test").Page) {
    const fakeSession = buildFakeSupabaseSession();

    await clearSupabaseBrowserState(page);

    await page.route("**/auth/v1/user*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({
                status: 204,
                headers: supabaseCorsHeaders,
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify(fakeSession.user),
        });
    });

    await page.route("**/auth/v1/token*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({
                status: 204,
                headers: supabaseCorsHeaders,
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify(fakeSession),
        });
    });

    await page.route("**/rest/v1/user_profiles*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({
                status: 204,
                headers: supabaseCorsHeaders,
            });
            return;
        }

        await route.fulfill({
            status: 500,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify({
                message: "user_profiles table not available",
            }),
        });
    });

    await page.route("**/rest/v1/synced_records*", async (route) => {
        if (route.request().method() === "OPTIONS") {
            await route.fulfill({
                status: 204,
                headers: supabaseCorsHeaders,
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify([]),
        });
    });
}

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

    test.fixme("first-device recovery setup goes straight into the app after saving the key", async ({ page }) => {
        await mockFirstDeviceRecoveryFlow(page);

        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await page.getByLabel("Email address").fill("paid.user@example.com");
        await page.getByLabel("Password").fill("ValidPass123!");
        await page.getByRole("button", { name: "Sign in" }).click();

        await expect(page.getByRole("heading", { name: "Your Recovery Key" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Enter Recovery Key" })).toHaveCount(0);

        await page.getByLabel('Type "I UNDERSTAND" to continue').fill("I UNDERSTAND");
        await page.getByRole("button", { name: "Continue to dashboard" }).click();

        await expect(page.getByRole("heading", { name: "Dashboard" }).first()).toBeVisible();
        await expect(page.getByRole("heading", { name: "Enter Recovery Key" })).toHaveCount(0);
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
        await clearSupabaseBrowserState(page);
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
