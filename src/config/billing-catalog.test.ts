import { describe, expect, it } from "vitest";
import {
    BILLING_CATALOG,
    getBillingCatalogEntry,
    getYearlySavingsPercent,
} from "./billing-catalog";

describe("billing catalog", () => {
    it("keeps the exact LIVE Paystack env names and prices", () => {
        expect(BILLING_CATALOG.STANDARD_MONTHLY.envVarName).toBe("PAYSTACK_PLAN_STANDARD_MONTHLY");
        expect(BILLING_CATALOG.STANDARD_MONTHLY.amountCents).toBe(2900);

        expect(BILLING_CATALOG.STANDARD_YEARLY.envVarName).toBe("PAYSTACK_PLAN_STANDARD_YEARLY");
        expect(BILLING_CATALOG.STANDARD_YEARLY.amountCents).toBe(29900);

        expect(BILLING_CATALOG.PRO_MONTHLY.envVarName).toBe("PAYSTACK_PLAN_PRO_MONTHLY");
        expect(BILLING_CATALOG.PRO_MONTHLY.amountCents).toBe(4900);

        expect(BILLING_CATALOG.PRO_YEARLY.envVarName).toBe("PAYSTACK_PLAN_PRO_YEARLY");
        expect(BILLING_CATALOG.PRO_YEARLY.amountCents).toBe(39900);
    });

    it("resolves plan entries by internal plan id and billing cycle", () => {
        expect(getBillingCatalogEntry("standard", "yearly").key).toBe("STANDARD_YEARLY");
        expect(getBillingCatalogEntry("pro", "monthly").key).toBe("PRO_MONTHLY");
    });

    it("calculates the advertised yearly savings from the canonical prices", () => {
        expect(getYearlySavingsPercent("standard")).toBe(14);
        expect(getYearlySavingsPercent("pro")).toBe(32);
    });
});
