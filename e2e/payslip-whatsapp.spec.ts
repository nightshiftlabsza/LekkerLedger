import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { generateAccountMasterKey, generateValidationPayload, wrapMasterKeyWithPassword } from "../src/lib/crypto";
import { AUDIT_IDS, resetAndSeedAuditState } from "./audit/helpers";

const LOCALFORAGE_SCRIPT_PATH = path.join(process.cwd(), "node_modules", "localforage", "dist", "localforage.js");
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
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
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
        id: "payslip-preview-user-1",
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

async function preparePaidPreview(page: Page) {
    const fakeSession = buildFakeSupabaseSession();
    const password = "ValidPass123!";
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
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
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
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
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
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
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
            await route.fulfill({ status: 204, headers: supabaseCorsHeaders });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: supabaseCorsHeaders,
            body: JSON.stringify([]),
        });
    });

    await page.route("**/api/billing/account", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                entitlements: {
                    planId: "standard",
                    billingCycle: "monthly",
                    status: "active",
                    cancelAtPeriodEnd: false,
                    availableReferralMonths: 0,
                    pendingReferralMonths: 0,
                    isActive: true,
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
}

async function stubWindowOpen(page: Page, blocked = false) {
    await page.addInitScript(({ blockedOpen }) => {
        (window as Window & { __openCalls?: unknown[] }).__openCalls = [];
        window.open = (...args) => {
            (window as Window & { __openCalls?: unknown[] }).__openCalls?.push(args);
            return blockedOpen ? null : ({ closed: false } as Window);
        };
    }, { blockedOpen: blocked });
}

async function getOpenCalls(page: Page) {
    return page.evaluate(() => ((window as Window & { __openCalls?: unknown[] }).__openCalls ?? []) as unknown[][]);
}

async function expectNoHorizontalOverflow(page: Page) {
    const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
    }));

    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
    expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

async function openPreview(page: Page, employeeId = AUDIT_IDS.employeeA) {
    await page.goto(`/employees/${employeeId}/history`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: /History$/ }).waitFor();
    await page.getByRole("button", { name: "View" }).first().click();
    await page.getByRole("heading", { name: "Payslip record" }).waitFor();
}

async function openPaidApp(page: Page) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.getByTestId("account-menu-toggle").waitFor();
}

async function clearEmployeePhone(page: Page, employeeId: string) {
    await page.addScriptTag({ path: LOCALFORAGE_SCRIPT_PATH });
    await page.evaluate(async ({ targetEmployeeId }) => {
        const localforageApi = (window as Window & { localforage: { createInstance: (options: { name: string; storeName: string }) => { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void>; }; }; }).localforage;
        const employeeStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "employees" });
        const rawEmployee = await employeeStore.getItem(targetEmployeeId);

        if (!rawEmployee) {
            return;
        }

        const decodedEmployee = JSON.parse(decodeURIComponent(atob(rawEmployee)));
        decodedEmployee.phone = "";
        await employeeStore.setItem(targetEmployeeId, btoa(encodeURIComponent(JSON.stringify(decodedEmployee))));
    }, { targetEmployeeId: employeeId });
}

test.describe("Payslip preview WhatsApp flow", () => {
    test("desktop opens the in-app modal first, then downloads and opens the employee chat", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await stubWindowOpen(page);
        await resetAndSeedAuditState(page, "full");
        await preparePaidPreview(page);
        await openPaidApp(page);
        await openPreview(page);

        await expect(page.getByText("Payslip ready to review, download, and share.")).toHaveCount(0);

        await page.getByRole("button", { name: "WhatsApp" }).first().click();
        await expect(page.getByRole("dialog", { name: "Send payslip on WhatsApp" })).toBeVisible();
        await expect(page.getByTestId("whatsapp-share-modal")).toBeVisible();
        await expect.poll(async () => (await getOpenCalls(page)).length).toBe(0);

        const modal = page.getByTestId("whatsapp-share-modal");
        const box = await modal.boundingBox();
        const viewport = page.viewportSize();

        expect(viewport).not.toBeNull();
        expect(box).not.toBeNull();

        if (!viewport || !box) {
            throw new Error("Desktop modal metrics were unavailable.");
        }

        expect(box.width).toBeGreaterThanOrEqual(600);
        expect(Math.abs((box.x + (box.width / 2)) - (viewport.width / 2))).toBeLessThanOrEqual(8);

        const downloadPromise = page.waitForEvent("download");
        await page.getByTestId("whatsapp-share-confirm").click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain("Payslip_Thandi_Dlamini_Mar_2026.pdf");
        await expect(page.getByTestId("whatsapp-share-dialog")).toHaveCount(0);
        await expect.poll(async () => (await getOpenCalls(page)).length).toBe(1);

        const openCalls = await getOpenCalls(page);
        expect(String(openCalls[0]?.[0] ?? "")).toContain("https://wa.me/27821111111");
        await expectNoHorizontalOverflow(page);
    });

    test("mobile uses a bottom sheet before running the WhatsApp flow", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await stubWindowOpen(page);
        await resetAndSeedAuditState(page, "full");
        await preparePaidPreview(page);
        await openPaidApp(page);
        await openPreview(page);

        await page.getByRole("button", { name: "WhatsApp" }).first().click();
        const sheet = page.getByTestId("whatsapp-share-sheet");
        await expect(sheet).toBeVisible();

        const viewport = page.viewportSize();
        const box = await sheet.boundingBox();
        expect(viewport).not.toBeNull();
        expect(box).not.toBeNull();

        if (!viewport || !box) {
            throw new Error("Mobile sheet metrics were unavailable.");
        }

        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height).toBeGreaterThanOrEqual(viewport.height - 2);
        await expectNoHorizontalOverflow(page);
    });

    test("ultrawide keeps the modal intentional and readable", async ({ page }) => {
        await page.setViewportSize({ width: 2560, height: 1080 });
        await stubWindowOpen(page);
        await resetAndSeedAuditState(page, "full");
        await preparePaidPreview(page);
        await openPaidApp(page);
        await openPreview(page);

        await page.getByRole("button", { name: "WhatsApp" }).first().click();
        const modal = page.getByTestId("whatsapp-share-modal");
        await expect(modal).toBeVisible();

        const viewport = page.viewportSize();
        const box = await modal.boundingBox();
        expect(viewport).not.toBeNull();
        expect(box).not.toBeNull();

        if (!viewport || !box) {
            throw new Error("Ultrawide modal metrics were unavailable.");
        }

        expect(box.width).toBeGreaterThanOrEqual(600);
        expect(box.width).toBeLessThanOrEqual(760);
        expect(Math.abs((box.x + (box.width / 2)) - (viewport.width / 2))).toBeLessThanOrEqual(8);
        await expectNoHorizontalOverflow(page);
    });

    test("missing phone number keeps the fallback truthful and skips direct chat launch", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await stubWindowOpen(page);
        await resetAndSeedAuditState(page, "full");
        await preparePaidPreview(page);
        await openPaidApp(page);
        await clearEmployeePhone(page, AUDIT_IDS.employeeA);
        await openPreview(page);

        await page.getByRole("button", { name: "WhatsApp" }).first().click();
        await expect(page.getByText("This employee does not have a phone number saved, so we cannot open the chat for you.")).toBeVisible();

        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Save payslip" }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain("Payslip_Thandi_Dlamini_Mar_2026.pdf");
        await expect(page.getByTestId("whatsapp-share-dialog")).toHaveCount(0);
        await expect.poll(async () => (await getOpenCalls(page)).length).toBe(0);
        await expectNoHorizontalOverflow(page);
    });
});
