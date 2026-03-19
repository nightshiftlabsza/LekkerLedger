import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { CANONICAL_SITE_URL, INDEXABLE_PUBLIC_ROUTES, SITEMAP_LAST_MODIFIED } from "@/lib/seo";

describe("sitemap", () => {
    it("only includes the intended indexable public routes", () => {
        const entries = sitemap();

        expect(entries.map((entry) => entry.url)).toEqual(
            INDEXABLE_PUBLIC_ROUTES.map((route) => `${CANONICAL_SITE_URL}${route === "/" ? "" : route}`),
        );
    });

    it("uses deterministic metadata and excludes legacy or internal URLs", () => {
        const entries = sitemap();

        expect(entries.every((entry) => entry.lastModified?.toISOString() === SITEMAP_LAST_MODIFIED.toISOString())).toBe(true);
        expect(entries.some((entry) => entry.url.includes("/resources/templates"))).toBe(false);
        expect(entries.some((entry) => entry.url.includes("/help/"))).toBe(false);
        expect(entries.some((entry) => entry.url.includes("/billing/"))).toBe(false);
        expect(entries.some((entry) => entry.url.includes("/support"))).toBe(false);
        expect(entries.some((entry) => entry.url.includes("/dashboard"))).toBe(false);
    });
});
