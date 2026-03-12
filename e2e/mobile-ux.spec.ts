import { test, expect } from "@playwright/test";

test.describe("Mobile UX regressions", () => {
    test.use({ viewport: { width: 375, height: 812 }, isMobile: true });

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
        await page.getByRole("button", { name: "Login (Paid users)" }).click();

        await expect(page.getByRole("region", { name: "Paid user login area" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Paid account login" })).toBeVisible();

        const metrics = await page.evaluate(() => ({
            panelWidth: document.querySelector<HTMLElement>("#homepage-auth-panel")?.scrollWidth ?? 0,
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
});
