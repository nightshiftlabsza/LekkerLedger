import { describe, expect, it } from "vitest";
import { buildBillingIssue } from "./billing-issues";

describe("billing issues", () => {
    it("hides raw Paystack plan config errors behind a safe customer message", () => {
        const issue = buildBillingIssue({
            lastError: "Plan code is invalid",
        });

        expect(issue?.code).toBe("paystack_plan_configuration_invalid");
        expect(issue?.customerMessage).not.toContain("Plan code is invalid");
    });

    it("preserves actionable non-config errors for the customer", () => {
        const issue = buildBillingIssue({
            lastError: "We could not renew your subscription from the saved card.",
        });

        expect(issue?.code).toBe("renewal_setup_required");
        expect(issue?.customerMessage).toContain("saved card");
    });
});
