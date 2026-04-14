import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { CANONICAL_SITE_URL, SITEMAP_LAST_MODIFIED, SITEMAP_PUBLIC_ROUTES } from "@/lib/seo";

describe("sitemap", () => {
    it("only includes the intended indexable public routes", () => {
        const entries = sitemap();

        expect(entries.map((entry) => entry.url)).toEqual(
            SITEMAP_PUBLIC_ROUTES.map((route) => `${CANONICAL_SITE_URL}${route === "/" ? "" : route}`),
        );
    });

    it("uses deterministic metadata and excludes legacy or internal URLs", () => {
        const entries = sitemap();

        expect(entries.every((entry) => entry.lastModified?.toISOString() === SITEMAP_LAST_MODIFIED.toISOString())).toBe(true);
        expect(entries.some((entry) => entry.url.endsWith("/trust"))).toBe(true);
        expect(entries.some((entry) => entry.url.includes("/resources/templates"))).toBe(false);
        expect(entries.some((entry) => entry.url.endsWith("/resources/guides"))).toBe(false);
        expect(entries.some((entry) => entry.url.endsWith("/resources/tools"))).toBe(false);
        expect(entries.some((entry) => entry.url.endsWith("/resources/checklists"))).toBe(false);
        expect(entries.some((entry) => entry.url.endsWith("/resources/guides/ccma-and-disciplinary-procedures"))).toBe(true);
        expect(entries.some((entry) => entry.url.includes("/help/"))).toBe(false);
        expect(entries.some((entry) => entry.url.includes("/billing/"))).toBe(false);
        expect(entries.some((entry) => entry.url.endsWith("/support"))).toBe(true);
        expect(entries.some((entry) => entry.url.includes("/dashboard"))).toBe(false);
    });

    it("only gives the highest priority to core search-intent pages", () => {
        const entries = sitemap();
        const highPriorityUrls = entries.filter((entry) => entry.priority === 1).map((entry) => entry.url);

        expect(highPriorityUrls).toEqual([
            `${CANONICAL_SITE_URL}`,
            `${CANONICAL_SITE_URL}/pricing`,
            `${CANONICAL_SITE_URL}/calculator`,
            `${CANONICAL_SITE_URL}/uif-calculator`,
            `${CANONICAL_SITE_URL}/ufiling-errors`,
            `${CANONICAL_SITE_URL}/resources/tools/domestic-worker-payslip`,
        ]);
    });
});
