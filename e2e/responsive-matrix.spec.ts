import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { AUDIT_IDS, collectAuditMetrics, resetAndSeedAuditState } from "./audit/helpers";
import type { SeedMode } from "./audit/types";

type MatrixRoute = {
    slug: string;
    route: string;
    seed: SeedMode;
};

const VIEWPORTS = [
    { name: "mobile-360", width: 360, height: 800 },
    { name: "mobile-390", width: 390, height: 844 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "laptop-1280", width: 1280, height: 800 },
    { name: "desktop-1366", width: 1366, height: 768 },
    { name: "desktop-1536", width: 1536, height: 864 },
    { name: "large-1728", width: 1728, height: 1117 },
    { name: "ultrawide-2560", width: 2560, height: 1080 },
] as const;

const PUBLIC_ROUTES: MatrixRoute[] = [
    { slug: "home", route: "/", seed: "empty" },
    { slug: "pricing", route: "/pricing", seed: "empty" },
    { slug: "calculator", route: "/calculator", seed: "empty" },
    { slug: "examples", route: "/examples", seed: "empty" },
    { slug: "support", route: "/support", seed: "empty" },
    { slug: "storage", route: "/storage", seed: "empty" },
    { slug: "trust", route: "/trust", seed: "empty" },
    { slug: "free-payslip", route: "/resources/tools/domestic-worker-payslip", seed: "empty" },
    { slug: "billing-success", route: "/billing/success?reference=audit-ref", seed: "empty" },
] as const;

const AUTH_ROUTES: MatrixRoute[] = [
    { slug: "login", route: "/login", seed: "empty" },
    { slug: "signup", route: "/signup", seed: "empty" },
    { slug: "home-auth-modal", route: "/?auth=login", seed: "empty" },
    { slug: "onboarding", route: "/onboarding", seed: "empty" },
] as const;

const PROTECTED_ROUTES: MatrixRoute[] = [
    { slug: "dashboard", route: "/dashboard", seed: "starter" },
    { slug: "settings", route: "/settings", seed: "starter" },
    { slug: "settings-storage", route: "/settings?tab=storage", seed: "starter" },
    { slug: "employees", route: "/employees", seed: "full" },
    { slug: "leave", route: "/leave", seed: "full" },
    { slug: "payroll", route: "/payroll", seed: "full" },
    { slug: "documents", route: "/documents", seed: "full" },
    { slug: "documents-contracts", route: "/documents?tab=contracts", seed: "full" },
    { slug: "ufiling", route: "/ufiling", seed: "full" },
    { slug: "wizard", route: `/wizard?empId=${AUDIT_IDS.employeeA}`, seed: "full" },
    { slug: "preview", route: `/preview?payslipId=${AUDIT_IDS.payslipA}&empId=${AUDIT_IDS.employeeA}`, seed: "full" },
    { slug: "upgrade", route: "/upgrade", seed: "starter" },
] as const;

const ROUTE_GROUPS = [
    { name: "public", routes: PUBLIC_ROUTES },
    { name: "auth", routes: AUTH_ROUTES },
    { name: "protected", routes: PROTECTED_ROUTES },
] as const;

test.describe("Responsive screenshot matrix", () => {
    test.describe.configure({ mode: "serial" });

    for (const viewport of VIEWPORTS) {
        test(`captures the ${viewport.name} matrix`, async ({ browser }) => {
            test.setTimeout(18 * 60 * 1000);
            const screenshotDir = path.join(process.cwd(), "artifacts", "responsive-audit", "matrix", viewport.name);
            await mkdir(screenshotDir, { recursive: true });

            for (const group of ROUTE_GROUPS) {
                for (const route of group.routes) {
                    const page = await browser.newPage({
                        viewport: { width: viewport.width, height: viewport.height },
                    });

                    try {
                        await resetAndSeedAuditState(page, route.seed);
                        await page.goto(route.route, { waitUntil: "domcontentloaded", timeout: 30_000 });
                        await page.waitForTimeout(900);

                        const metrics = await collectAuditMetrics(page);
                        const screenshotPath = path.join(screenshotDir, `${group.name}-${route.slug}.png`);
                        await page.screenshot({ path: screenshotPath, fullPage: true });

                        expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 4);
                    } finally {
                        await page.close();
                    }
                }
            }
        });
    }
});
