import { describe, expect, it } from "vitest";
import { PLANS } from "@/src/config/plans";
import { assertCanUploadSignedContractCopies, canUploadSignedContractCopies } from "./entitlements";

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
});
