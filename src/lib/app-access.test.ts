import { describe, expect, it } from "vitest";
import { isPaidDashboardFlow, shouldRedirectFreeUserFromApp } from "./app-access";

describe("app access guard", () => {
    it("redirects free users once paid access has been fully checked", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
        })).toBe(true);
    });

    it("allows the one-time paid activation step on dashboard", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: true,
        })).toBe(false);
    });

    it("does not redirect before settings are loaded", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: false,
            paidFlowRequested: false,
        })).toBe(false);
    });
});

describe("paid dashboard flow detection", () => {
    it("recognizes the initial paid login handoff", () => {
        expect(isPaidDashboardFlow({
            pathname: "/dashboard",
            paidLoginParam: "1",
            activationParam: null,
            syncParam: null,
        })).toBe(true);
    });

    it("recognizes the paid activation success state", () => {
        expect(isPaidDashboardFlow({
            pathname: "/dashboard",
            paidLoginParam: null,
            activationParam: "paid-login-success",
            syncParam: null,
        })).toBe(true);
    });

    it("recognizes dashboard sync follow-up state", () => {
        expect(isPaidDashboardFlow({
            pathname: "/dashboard",
            paidLoginParam: null,
            activationParam: null,
            syncParam: "restored",
        })).toBe(true);
    });
});
