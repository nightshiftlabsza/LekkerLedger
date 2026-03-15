import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
    { width: 1440, height: 900 },
] as const;

async function openCheckoutFromHomepage(page: Page) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const pricingPreview = page.locator("#pricing-preview");
    const standardCard = pricingPreview.locator("article").filter({ hasText: "Standard" }).first();
    await standardCard.getByRole("button").click();
}

async function openCheckoutFromPricingPage(page: Page) {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    const standardCard = page.locator("article").filter({ hasText: "Standard" }).first();
    await standardCard.getByRole("button").click();
}

async function expectModalLayout(page: Page) {
    const modal = page.getByTestId("paid-plan-checkout-modal");
    const overlay = page.getByTestId("paid-plan-checkout-overlay");

    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "Open secure payment" }).last()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    const box = await modal.boundingBox();
    expect(box).not.toBeNull();

    if (!viewport || !box) {
        throw new Error("Viewport or modal box was unavailable.");
    }

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);

    const modalCenterX = box.x + (box.width / 2);
    const modalCenterY = box.y + (box.height / 2);
    expect(Math.abs(modalCenterX - (viewport.width / 2))).toBeLessThanOrEqual(4);
    expect(Math.abs(modalCenterY - (viewport.height / 2))).toBeLessThanOrEqual(8);

    const overlayMetrics = await overlay.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
    }));
    expect(overlayMetrics.scrollWidth).toBeLessThanOrEqual(overlayMetrics.clientWidth + 1);

    const pageMetrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
    }));
    expect(pageMetrics.bodyScrollWidth).toBeLessThanOrEqual(pageMetrics.innerWidth + 1);
    expect(pageMetrics.docScrollWidth).toBeLessThanOrEqual(pageMetrics.innerWidth + 1);
}

for (const viewport of VIEWPORTS) {
    test(`homepage checkout modal stays centered at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openCheckoutFromHomepage(page);
        await expectModalLayout(page);
    });

    test(`/pricing checkout modal stays centered at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openCheckoutFromPricingPage(page);
        await expectModalLayout(page);
    });
}
