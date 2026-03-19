import type { BillingCycle, PlanId } from "../config/plans";
import { getPlanPrice } from "../config/plans";
import type { BillingProrationPreview } from "./billing";

function clampFraction(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
}

export function calculateRemainingFraction(input: {
    currentPeriodStart: number;
    currentPeriodEnd: number;
    now?: number;
}): number {
    const now = input.now ?? Date.now();
    const total = input.currentPeriodEnd - input.currentPeriodStart;
    const remaining = input.currentPeriodEnd - now;

    if (total <= 0 || remaining <= 0) {
        return 0;
    }

    return clampFraction(remaining / total);
}

export function buildProrationPreview(input: {
    currentPlanId: Exclude<PlanId, "free">;
    currentBillingCycle: BillingCycle;
    targetPlanId: Exclude<PlanId, "free">;
    targetBillingCycle: BillingCycle;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    now?: number;
}): BillingProrationPreview {
    const remainingFraction = calculateRemainingFraction({
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        now: input.now,
    });

    const currentPrice = (getPlanPrice(input.currentPlanId, input.currentBillingCycle) ?? 0) * 100;
    const targetPrice = (getPlanPrice(input.targetPlanId, input.targetBillingCycle) ?? 0) * 100;
    const creditAppliedCents = Math.round(currentPrice * remainingFraction);
    const targetChargeCents = Math.round(targetPrice * remainingFraction);

    return {
        amountDueNowCents: Math.max(0, targetChargeCents - creditAppliedCents),
        creditAppliedCents,
        remainingFraction,
        nextRenewalDate: new Date(input.currentPeriodEnd).toISOString(),
        nextRecurringAmountCents: targetPrice,
        currency: "ZAR",
    };
}
