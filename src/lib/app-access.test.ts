import { describe, expect, it } from "vitest";
import { shouldRedirectFreeUserFromApp } from "./app-access";

describe("app access guard", () => {
    it("redirects free users out of app routes once settings are ready", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidLoginRequested: false,
        })).toBe(true);
    });

    it("allows the one-time paid activation step on dashboard", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidLoginRequested: true,
        })).toBe(false);
    });

    it("does not redirect before settings are loaded", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: false,
            paidLoginRequested: false,
        })).toBe(false);
    });
});
