import { test } from "@playwright/test";

const widths = [375, 768, 1280, 1600];
const routes = [
  { path: "/", name: "home" },
  { path: "/pricing", name: "pricing" },
  { path: "/dashboard", name: "app-dashboard" },
];

for (const width of widths) {
  test.describe(`visual smoke ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const route of routes) {
      test(`snapshot ${route.name} at ${width}px`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `e2e-screenshots/visual-${route.name}-${width}.png`,
          fullPage: true,
        });
      });
    }
  });
}
