import { describe, expect, it } from "vitest";
import {
    getMarketingPlanFeatureSections,
    getMarketingPlanHref,
    getMarketingPlanDisplay,
    getMarketingPriceDisplay,
} from "./pricing-display";

describe("pricing display routes", () => {
    it("sends the free plan to the public payslip tool", () => {
        expect(getMarketingPlanHref("free", "monthly")).toBe("/resources/tools/domestic-worker-payslip");
    });

    it("keeps paid plans on the checkout flow", () => {
        expect(getMarketingPlanHref("standard", "monthly")).toBe("/upgrade?plan=standard&billing=monthly&pay=1");
        expect(getMarketingPlanHref("pro", "yearly")).toBe("/upgrade?plan=pro&billing=yearly&pay=1");
    });

    it("removes the redundant no-account feature from the free plan list", () => {
        expect(getMarketingPlanDisplay("free").liveFeatures).not.toContain("No account needed");
    });

    it("keeps pro live features separate from planned features", () => {
        const sections = getMarketingPlanFeatureSections("pro");

        expect(sections).toEqual([
            {
                kind: "live",
                title: "Everything in Standard, plus:",
                items: [
                    "Unlimited employees",
                    "Document vault for any employment files",
                    "Year-end employment summary PDF",
                    "5 years of searchable history",
                    "Multiple households",
                    "Faster support",
                ],
            },
            {
                kind: "planned",
                title: "Planned features",
                items: [
                    "Android app access when available",
                    "Notification reminders",
                    "Advanced employment records",
                ],
            },
        ]);
    });

    it("uses the live yearly Standard price and savings helper copy", () => {
        expect(getMarketingPriceDisplay("standard", "yearly")).toEqual({
            primary: "R299",
            periodLabel: "/year",
            helperText: "≈ R24.92/month",
        });
    });
});
