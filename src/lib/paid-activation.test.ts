import { describe, expect, it } from "vitest";
import { buildPaidActivationHref, buildPaidDashboardHref, buildPaidLoginHref, PAID_LOGIN_SUCCESS_QUERY } from "./paid-activation";

describe("paid activation routes", () => {
    it("builds the paid login handoff URL", () => {
        expect(buildPaidLoginHref("ref_123")).toBe("/login?reference=ref_123");
        expect(buildPaidLoginHref("")).toBe("/login");
    });

    it("builds the dashboard activation URL", () => {
        expect(buildPaidDashboardHref({ reference: "ref_123" })).toBe("/dashboard?paidLogin=1&reference=ref_123");
        expect(buildPaidDashboardHref({ reference: "ref_123", activation: PAID_LOGIN_SUCCESS_QUERY })).toBe("/dashboard?paidLogin=1&reference=ref_123&activation=paid-login-success");
        expect(buildPaidDashboardHref({ activation: PAID_LOGIN_SUCCESS_QUERY })).toBe("/dashboard?activation=paid-login-success");
    });

    it("builds the hosted activation URL", () => {
        expect(buildPaidActivationHref("ref_123")).toBe("/billing/activate?reference=ref_123");
        expect(buildPaidActivationHref("")).toBe("/billing/activate");
    });
});
