import { describe, expect, it } from "vitest";
import { isPaidDashboardFlow, shouldRedirectFreeUserFromApp } from "./app-access";

describe("app access guard", () => {
    it("redirects free users once paid access has been fully checked", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "not_needed",
        })).toBe(true);
    });

    it("allows the one-time paid activation step on dashboard", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: true,
            subscriptionStatus: "resolved",
            unlockStatus: "not_needed",
        })).toBe(false);
    });

    it("does not redirect before settings are loaded", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: false,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "not_needed",
        })).toBe(false);
    });

    it("does not redirect while subscription is still loading", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "loading",
            unlockStatus: "not_needed",
        })).toBe(false);
    });

    it("does not redirect while subscription status is idle", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "idle",
            unlockStatus: "not_needed",
        })).toBe(false);
    });

    it("does not redirect when encryption setup is required", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "required",
        })).toBe(false);
    });

    it("does not redirect when unlock status is pending", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "pending",
        })).toBe(false);
    });

    it("does not redirect when a pending billing reference exists", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "not_needed",
            hasPendingReference: true,
        })).toBe(false);
    });

    it("still redirects free user when all guards pass", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "resolved",
            hasPendingReference: false,
        })).toBe(true);
    });

    it("does not redirect paid users even when all other guards pass", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "standard",
            settingsReady: true,
            paidFlowRequested: false,
            subscriptionStatus: "resolved",
            unlockStatus: "resolved",
            hasPendingReference: false,
        })).toBe(false);
    });

    it("backwards-compatible when new optional params are omitted", () => {
        expect(shouldRedirectFreeUserFromApp({
            pathname: "/dashboard",
            planId: "free",
            settingsReady: true,
            paidFlowRequested: false,
        })).toBe(true);
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
