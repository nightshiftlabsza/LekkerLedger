import type { BillingIssue } from "./billing";

export function isPaystackPlanConfigMessage(message: string | null | undefined): boolean {
    const normalized = (message || "").trim().toLowerCase();
    return normalized.includes("plan code is invalid")
        || normalized.includes("paystack plan code missing")
        || normalized.includes("paystack plan configuration")
        || normalized.includes("paystack plan validation");
}

export function buildBillingIssue(input: {
    lastError?: string | null;
    hasPlanValidationIssue?: boolean;
    planValidationMessage?: string | null;
    usesManualRenewalAdjustment?: boolean;
}): BillingIssue | undefined {
    if (input.hasPlanValidationIssue) {
        return {
            code: "paystack_plan_configuration_invalid",
            customerMessage: "Your paid access is active. Renewal setup needs an internal billing fix before the next renewal.",
            adminMessage: input.planValidationMessage || input.lastError || undefined,
        };
    }

    if (input.usesManualRenewalAdjustment) {
        return {
            code: "manual_renewal_adjustment",
            customerMessage: "A billing credit will be applied to your next renewal automatically.",
            adminMessage: input.planValidationMessage || undefined,
        };
    }

    if (isPaystackPlanConfigMessage(input.lastError)) {
        return {
            code: "paystack_plan_configuration_invalid",
            customerMessage: "Your paid access is active. Renewal setup needs an internal billing fix before the next renewal.",
            adminMessage: input.lastError || undefined,
        };
    }

    if (input.lastError) {
        return {
            code: "renewal_setup_required",
            customerMessage: input.lastError,
        };
    }

    return undefined;
}
