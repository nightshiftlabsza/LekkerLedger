import { describe, expect, it } from "vitest";
import { buildProrationPreview } from "./billing-proration";

describe("billing proration", () => {
    it("calculates a mid-cycle Standard monthly to Pro monthly upgrade", () => {
        const preview = buildProrationPreview({
            currentPlanId: "standard",
            currentBillingCycle: "monthly",
            targetPlanId: "pro",
            targetBillingCycle: "monthly",
            currentPeriodStart: Date.parse("2026-03-01T00:00:00.000Z"),
            currentPeriodEnd: Date.parse("2026-04-01T00:00:00.000Z"),
            now: Date.parse("2026-03-16T12:00:00.000Z"),
        });

        expect(preview.creditAppliedCents).toBeGreaterThan(0);
        expect(preview.amountDueNowCents).toBeGreaterThan(0);
        expect(preview.nextRecurringAmountCents).toBe(4900);
        expect(preview.nextRenewalDate).toBe("2026-04-01T00:00:00.000Z");
    });

    it("returns zero due now when moving to a cheaper plan late in the cycle", () => {
        const preview = buildProrationPreview({
            currentPlanId: "pro",
            currentBillingCycle: "monthly",
            targetPlanId: "standard",
            targetBillingCycle: "monthly",
            currentPeriodStart: Date.parse("2026-03-01T00:00:00.000Z"),
            currentPeriodEnd: Date.parse("2026-04-01T00:00:00.000Z"),
            now: Date.parse("2026-03-30T00:00:00.000Z"),
        });

        expect(preview.amountDueNowCents).toBe(0);
        expect(preview.creditAppliedCents).toBeGreaterThan(0);
        expect(preview.nextRecurringAmountCents).toBe(2900);
    });
});
