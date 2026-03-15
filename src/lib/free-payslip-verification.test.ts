import { describe, expect, it } from "vitest";
import {
    buildFreePayslipVerificationHref,
    FREE_PAYSLIP_TOOL_PATH,
    isFreePayslipVerificationPath,
    parseFreePayslipVerificationState,
} from "./free-payslip-verification";

describe("free payslip verification helpers", () => {
    it("builds the public tool return path", () => {
        expect(buildFreePayslipVerificationHref("success")).toBe(
            "/resources/tools/domestic-worker-payslip?freePayslipVerification=success",
        );
    });

    it("detects the public tool route even when query params are present", () => {
        expect(isFreePayslipVerificationPath(FREE_PAYSLIP_TOOL_PATH)).toBe(true);
        expect(isFreePayslipVerificationPath(`${FREE_PAYSLIP_TOOL_PATH}?freePayslipVerification=success`)).toBe(true);
        expect(isFreePayslipVerificationPath("/dashboard")).toBe(false);
    });

    it("parses only supported verification states", () => {
        expect(parseFreePayslipVerificationState("success")).toBe("success");
        expect(parseFreePayslipVerificationState("invalid-link")).toBe("invalid-link");
        expect(parseFreePayslipVerificationState("missing-session")).toBe("missing-session");
        expect(parseFreePayslipVerificationState("other")).toBeNull();
        expect(parseFreePayslipVerificationState(null)).toBeNull();
    });
});
