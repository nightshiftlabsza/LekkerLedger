import { describe, expect, it } from "vitest";
import { getMarketingPlanHref } from "./pricing-display";

describe("pricing display routes", () => {
    it("sends the free plan to the public payslip tool", () => {
        expect(getMarketingPlanHref("free", "monthly")).toBe("/resources/tools/domestic-worker-payslip");
    });

    it("keeps paid plans on the checkout flow", () => {
        expect(getMarketingPlanHref("standard", "monthly")).toBe("/upgrade?plan=standard&billing=monthly&pay=1");
        expect(getMarketingPlanHref("pro", "yearly")).toBe("/upgrade?plan=pro&billing=yearly&pay=1");
    });
});
