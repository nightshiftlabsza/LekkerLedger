import { describe, expect, it } from "vitest";
import {
    buildProtectedRouteLoginRedirect,
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
