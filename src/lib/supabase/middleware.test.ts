import { describe, expect, it } from "vitest";
import { buildProtectedRouteLoginRedirect } from "./middleware";

describe("buildProtectedRouteLoginRedirect", () => {
    it("sends protected route visitors into the homepage login modal", () => {
        const redirectedUrl = buildProtectedRouteLoginRedirect(new URL("https://example.com/dashboard"));

        expect(redirectedUrl.toString()).toBe("https://example.com/?auth=login&next=%2Fdashboard");
    });

    it("preserves the original path and query for the post-login return", () => {
        const redirectedUrl = buildProtectedRouteLoginRedirect(
            new URL("https://example.com/dashboard?paidLogin=1&reference=ref_123"),
        );

        expect(redirectedUrl.toString()).toBe(
            "https://example.com/?auth=login&next=%2Fdashboard%3FpaidLogin%3D1%26reference%3Dref_123",
        );
    });
});
