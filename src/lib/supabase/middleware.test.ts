import { describe, expect, it, vi } from "vitest";
import {
    buildProtectedRouteLoginRedirect,
    resolveCanonicalRedirect,
    shouldApplyNoIndex,
} from "./middleware";

describe("buildProtectedRouteLoginRedirect", () => {
    it("sends protected route visitors into the dedicated login page", () => {
        const redirectedUrl = buildProtectedRouteLoginRedirect(new URL("https://example.com/dashboard"));

        expect(redirectedUrl.toString()).toBe("https://example.com/login?next=%2Fdashboard");
    });

    it("preserves the original path and query for the post-login return", () => {
        const redirectedUrl = buildProtectedRouteLoginRedirect(
            new URL("https://example.com/dashboard?paidLogin=1&reference=ref_123"),
        );

        expect(redirectedUrl.toString()).toBe(
            "https://example.com/login?next=%2Fdashboard%3FpaidLogin%3D1%26reference%3Dref_123",
        );
    });
});

describe("resolveCanonicalRedirect", () => {
    it("normalizes protocol, host, and legacy routes in one hop", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        try {
            const redirectedUrl = resolveCanonicalRedirect(
                new URL("http://www.lekkerledger.co.za/help/coida?auth=login"),
            );

            expect(redirectedUrl?.toString()).toBe(
                "https://lekkerledger.co.za/resources/guides/coida-and-roe-compliance?auth=login",
            );
        } finally {
            vi.unstubAllEnvs();
        }
    });

    it("returns null for an already canonical public URL", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        try {
            expect(resolveCanonicalRedirect(new URL("https://lekkerledger.co.za/resources"))).toBeNull();
        } finally {
            vi.unstubAllEnvs();
        }
    });

    it("keeps the current host when only a legacy route rewrite is needed", () => {
        const redirectedUrl = resolveCanonicalRedirect(
            new URL("https://lekkerledger-production.up.railway.app/help/coida?auth=login"),
        );

        expect(redirectedUrl?.toString()).toBe(
            "https://lekkerledger-production.up.railway.app/resources/guides/coida-and-roe-compliance?auth=login",
        );
    });

    it("does not force Railway requests onto a hard-coded host when no site url is configured", () => {
        expect(
            resolveCanonicalRedirect(new URL("https://lekkerledger-production.up.railway.app/dashboard")),
        ).toBeNull();
    });

    it("honors forwarded https headers so proxied custom domains do not self-redirect", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        try {
            const headers = new Headers({
                host: "lekkerledger.co.za",
                "x-forwarded-host": "lekkerledger.co.za",
                "x-forwarded-proto": "https",
            });

            expect(
                resolveCanonicalRedirect(new URL("http://lekkerledger.co.za/login"), headers),
            ).toBeNull();
        } finally {
            vi.unstubAllEnvs();
        }
    });
});

describe("shouldApplyNoIndex", () => {
    it("marks protected app routes as noindex", () => {
        expect(shouldApplyNoIndex("/dashboard", new URLSearchParams())).toBe(true);
    });

    it("marks public auth-state variants as noindex", () => {
        expect(shouldApplyNoIndex("/pricing", new URLSearchParams("auth=login"))).toBe(true);
    });

    it("marks public utility routes as noindex", () => {
        expect(shouldApplyNoIndex("/billing/checkout", new URLSearchParams("plan=pro"))).toBe(true);
    });

    it("keeps clean public marketing pages indexable", () => {
        expect(shouldApplyNoIndex("/support", new URLSearchParams())).toBe(false);
        expect(shouldApplyNoIndex("/resources/guides/uif-for-domestic-workers", new URLSearchParams())).toBe(false);
    });
});
