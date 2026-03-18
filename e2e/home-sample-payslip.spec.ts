import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
    { name: "mobile-390", width: 390, height: 844 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "laptop-1280", width: 1280, height: 900 },
    { name: "laptop-1366", width: 1366, height: 900 },
    { name: "desktop-1440", width: 1440, height: 960 },
    { name: "desktop-1536", width: 1536, height: 960 },
    { name: "desktop-1728", width: 1728, height: 1117 },
    { name: "desktop-1920", width: 1920, height: 1080 },
    { name: "ultrawide-2560", width: 2560, height: 1200 },
] as const;

test.describe("Home sample payslip card", () => {
    for (const viewport of VIEWPORTS) {
        test(`stays readable and within bounds at ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto("/");

            const card = page.getByTestId("sample-payslip-card");
            await expect(card).toBeVisible();

            const screenshotDir = path.join(process.cwd(), "artifacts", "sample-payslip-proof");
            await mkdir(screenshotDir, { recursive: true });
            await card.screenshot({ path: path.join(screenshotDir, `${viewport.name}.png`) });

            const metrics = await page.evaluate(() => {
                const card = document.querySelector<HTMLElement>('[data-testid="sample-payslip-card"]');
                if (!card) return null;

                const cardRect = card.getBoundingClientRect();
                const ledgerRows = Array.from(
                    card.querySelectorAll<HTMLElement>('[data-testid="sample-payslip-ledger-header"], [data-testid="sample-payslip-ledger-row"]'),
                );
                const visibleLedgerRows = ledgerRows.filter((row) => getComputedStyle(row).display !== "none");

                return {
                    windowWidth: window.innerWidth,
                    cardLeft: cardRect.left,
                    cardRight: cardRect.right,
                    cardScrollWidth: card.scrollWidth,
                    cardClientWidth: card.clientWidth,
                    visibleLedgerRows: visibleLedgerRows.map((row) => {
                        const rowRect = row.getBoundingClientRect();
                        return {
                            rowLeft: rowRect.left,
                            rowRight: rowRect.right,
                            cells: Array.from(row.children).map((cell) => {
                                const element = cell as HTMLElement;
                                const rect = element.getBoundingClientRect();
                                return {
                                    text: element.innerText.trim(),
                                    left: rect.left,
                                    right: rect.right,
                                    scrollWidth: element.scrollWidth,
                                    clientWidth: element.clientWidth,
                                };
                            }),
                        };
                    }),
                };
            });

            expect(metrics).not.toBeNull();
            expect(metrics!.cardScrollWidth).toBeLessThanOrEqual(metrics!.cardClientWidth + 2);
            expect(metrics!.cardLeft).toBeGreaterThanOrEqual(-1);
            expect(metrics!.cardRight).toBeLessThanOrEqual(metrics!.windowWidth + 1);

            for (const row of metrics!.visibleLedgerRows) {
                for (let index = 0; index < row.cells.length; index += 1) {
                    const cell = row.cells[index];
                    expect(cell.left).toBeGreaterThanOrEqual(row.rowLeft - 1);
                    expect(cell.right).toBeLessThanOrEqual(row.rowRight + 1);
                    expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 4);

                    if (index > 0) {
                        const previousCell = row.cells[index - 1];
                        expect(cell.left).toBeGreaterThanOrEqual(previousCell.right - 1);
                    }
                }
            }
        });
    }
});
