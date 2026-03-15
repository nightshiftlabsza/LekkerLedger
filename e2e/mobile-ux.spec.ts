import { test, expect } from "@playwright/test";
import { generateAccountMasterKey, generateValidationPayload, wrapMasterKeyWithPassword } from "../src/lib/crypto";

const MOBILE_BOTTOM_NAV_VIEWPORTS = [
    { width: 320, height: 640 },
    { width: 360, height: 800 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
] as const;

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
        id: "mobile-ux-user-1",
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

async function buildRecoverableProfile(password: string) {
    const masterKey = await generateAccountMasterKey();
    return {
        validationPayload: await generateValidationPayload(masterKey),
        wrappedMasterKeyUser: await wrapMasterKeyWithPassword(masterKey, password),
    };
}

async function prepareMobileDashboard(page: import("@playwright/test").Page, password: string) {
    const fakeSession = buildFakeSupabaseSession();
    const recoverableProfile = await buildRecoverableProfile(password);

    await page.context().addCookies([
        {
            name: "ll-e2e-auth-bypass",
            value: "1",
            url: "http://localhost:3002",
        },
    ]);

    await page.addInitScript(({ storageKey, session, nextPassword }) => {
        window.localStorage.setItem(storageKey, JSON.stringify({
            currentSession: session,
            expiresAt: session.expires_at * 1000,
        }));
        window.sessionStorage.setItem("lekkerledger:password-handoff", JSON.stringify({
            email: (session.user.email ?? "").toLowerCase(),
            password: nextPassword,
            createdAt: Date.now(),
        }));
    }, {
        storageKey: supabaseStorageKey,
        session: fakeSession,
        nextPassword: password,
    });

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
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify({
                encryption_mode: "recoverable",
                mode_version: 1,
                key_setup_complete: true,
                validation_payload: recoverableProfile.validationPayload,
                wrapped_master_key_user: recoverableProfile.wrappedMasterKeyUser,
                recent_recovery_notice_at: null,
                recent_recovery_event_kind: null,
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

test.describe("Mobile UX regressions", () => {
    test.use({ viewport: { width: 375, height: 812 }, isMobile: true });

    test("skip link stays hidden until keyboard focus", async ({ page }) => {
        await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
        const skipLink = page.getByText("Skip to content", { exact: true });

        const beforeFocus = await skipLink.evaluate((element) => {
            const styles = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return {
                opacity: styles.opacity,
                offscreen: rect.bottom < 0 || rect.right < 0 || rect.left < 0,
            };
        });

        expect(beforeFocus.offscreen).toBe(true);

        await page.keyboard.press("Tab");
        await expect(skipLink).toBeFocused();

        const afterFocus = await skipLink.evaluate((element) => {
            const styles = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return {
                opacity: styles.opacity,
                top: rect.top,
            };
        });

        expect(afterFocus.opacity).toBe("1");
        expect(afterFocus.top).toBeGreaterThanOrEqual(0);
    });

    test("homepage sample card avoids tiny text on phone", async ({ page }) => {
        await page.goto("/");
        const tinyTextInSample = await page.evaluate(() => {
            const card = document.querySelector<HTMLElement>("[data-testid='sample-payslip-card']");
            if (!card) return -1;
            return Array.from(card.querySelectorAll<HTMLElement>("*")).filter((element) => {
                const rect = element.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return false;
                const fontSize = Number.parseFloat(getComputedStyle(element).fontSize) || 0;
                return fontSize > 0 && fontSize < 12;
            }).length;
        });

        expect(tinyTextInSample).toBe(0);
    });

    test("homepage paid login panel fits on phone without horizontal overflow", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.getByRole("button", { name: "Log in" }).click();

        await expect(page.getByRole("dialog", { name: "Paid user login" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Paid account login" })).toBeVisible();

        const metrics = await page.evaluate(() => ({
            panelWidth: document.querySelector<HTMLElement>("dialog[aria-label='Paid user login'] > div")?.scrollWidth ?? 0,
            viewportWidth: window.innerWidth,
            bodyOverflowing: document.body.scrollWidth > window.innerWidth + 1,
        }));

        expect(metrics.panelWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.bodyOverflowing).toBe(false);
    });

    test("onboarding does not show app shell chrome on phone", async ({ page }) => {
        await page.goto("/onboarding");

        await expect(page.getByTestId("bottom-nav-home")).toHaveCount(0);
        await expect(page.getByTestId("global-create-fab")).toHaveCount(0);
        await expect(page.getByText("Local only")).toHaveCount(0);
    });

    test("settings registrations stack on phone", async ({ page }) => {
        await page.goto("/settings");
        await page.getByTestId("settings-tab-general").waitFor({ state: "visible" });
        await page.locator("#eid").waitFor({ state: "visible" });
        await page.locator("#uifref").waitFor({ state: "visible" });

        const positions = await page.evaluate(() => {
            const employerId = document.querySelector<HTMLInputElement>("#eid");
            const uifRef = document.querySelector<HTMLInputElement>("#uifref");
            if (!employerId || !uifRef) return null;

            const employerRect = employerId.getBoundingClientRect();
            const uifRect = uifRef.getBoundingClientRect();
            return {
                sameRow: Math.abs(employerRect.top - uifRect.top) < 20,
                leftDelta: Math.abs(employerRect.left - uifRect.left),
            };
        });

        expect(positions).not.toBeNull();
        expect(positions?.sameRow).toBe(false);
        expect(positions?.leftDelta).toBeLessThan(10);
    });

    test("bottom nav labels stay readable across common phone widths", async ({ page }) => {
        await prepareMobileDashboard(page, "ValidPass123!");

        for (const viewport of MOBILE_BOTTOM_NAV_VIEWPORTS) {
            await page.setViewportSize(viewport);
            await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
            await page.getByTestId("bottom-nav-home").waitFor({ state: "visible" });

            const metrics = await page.evaluate(() => {
                const nav = document.querySelector<HTMLElement>("nav[aria-label='Mobile navigation']");
                const labels = Array.from(document.querySelectorAll<HTMLElement>("[data-testid^='bottom-nav-'] span"));
                const buttons = Array.from(document.querySelectorAll<HTMLElement>("[data-testid^='bottom-nav-']"));

                return {
                    navOverflow: (nav?.scrollWidth ?? 0) > window.innerWidth + 1,
                    labelsOverflow: labels.some((label) => label.scrollWidth > label.clientWidth + 1),
                    labelHeights: labels.map((label) => label.getBoundingClientRect().height),
                    buttonWidths: buttons.map((button) => button.getBoundingClientRect().width),
                };
            });

            expect(metrics.navOverflow).toBe(false);
            expect(metrics.labelsOverflow).toBe(false);
            expect(metrics.labelHeights.every((height) => height <= 22)).toBe(true);
            expect(metrics.buttonWidths.every((width) => width >= 44)).toBe(true);
        }
    });

    test("free payslip generator fits on phone without horizontal overflow", async ({ page }) => {
        await page.goto("/resources/tools/domestic-worker-payslip");
        await expect(page.getByText("Create this month's payslip step by step")).toBeVisible();
        await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

        const metrics = await page.evaluate(() => ({
            bodyOverflowing: document.body.scrollWidth > window.innerWidth + 1,
            mainOverflowing: Array.from(document.querySelectorAll<HTMLElement>("main, section, aside")).some(
                (element) => element.scrollWidth > window.innerWidth + 1,
            ),
        }));

        expect(metrics.bodyOverflowing).toBe(false);
        expect(metrics.mainOverflowing).toBe(false);
    });
});

test.describe("App shell wide-screen verification", () => {
    test("dashboard shell stays clean on desktop and ultrawide screens", async ({ page }) => {
        await prepareMobileDashboard(page, "ValidPass123!");

        const wideViewports = [
            { width: 1366, height: 768 },
            { width: 1728, height: 1117 },
            { width: 2560, height: 1080 },
        ] as const;

        for (const viewport of wideViewports) {
            await page.setViewportSize(viewport);
            await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
            await expect(page.getByTestId("account-menu-toggle")).toBeVisible();
            await expect(page.getByTestId("bottom-nav-home")).toHaveCount(0);

            const metrics = await page.evaluate(() => ({
                hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
                mainWidth: document.querySelector("main")?.getBoundingClientRect().width ?? 0,
                viewportWidth: window.innerWidth,
            }));

            expect(metrics.hasOverflow).toBe(false);
            expect(metrics.mainWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        }
    });
});
