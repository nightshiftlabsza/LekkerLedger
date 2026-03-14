import { describe, expect, it } from "vitest";
import { PLANS } from "@/src/config/plans";
import { assertCanUploadSignedContractCopies, applyVerifiedEntitlementsToSettings, canUploadSignedContractCopies } from "./entitlements";

describe("signed contract upload entitlements", () => {
    it("maps contractSignedCopyUpload to Free, Standard, and Pro correctly", () => {
        expect(canUploadSignedContractCopies(PLANS.free)).toBe(false);
        expect(canUploadSignedContractCopies(PLANS.standard)).toBe(true);
        expect(canUploadSignedContractCopies(PLANS.pro)).toBe(true);
    });

    it("rejects signed contract uploads when the plan does not include the feature", () => {
        expect(() => assertCanUploadSignedContractCopies(PLANS.free)).toThrow(/standard and pro/i);
        expect(() => assertCanUploadSignedContractCopies(PLANS.standard)).not.toThrow();
    });

    it("overlays verified trial entitlements onto stored settings", () => {
        const settings = {
            employerName: "Test Employer",
            employerAddress: "",
            employerIdNumber: "",
            uifRefNumber: "",
            cfNumber: "",
            sdlNumber: "",
            phone: "",
            logoData: "",
            paidUntil: undefined,
            trialExpiry: undefined,
            defaultLanguage: "en" as const,
            simpleMode: false,
            advancedMode: false,
            density: "comfortable" as const,
            piiObfuscationEnabled: true,
            installationId: "abc",
            usageHistory: [],
            customLeaveTypes: [],
            proStatus: "free" as const,
            billingCycle: "monthly" as const,
            activeHouseholdId: "default",
        };

        expect(applyVerifiedEntitlementsToSettings(settings, {
            planId: "standard",
            status: "trialing",
            paidUntil: "2026-03-28T00:00:00.000Z",
            trialEndsAt: "2026-03-28T00:00:00.000Z",
            billingCycle: "yearly",
        })).toMatchObject({
            proStatus: "trial",
            paidUntil: "2026-03-28T00:00:00.000Z",
            trialExpiry: "2026-03-28T00:00:00.000Z",
            billingCycle: "yearly",
        });
    });
});
