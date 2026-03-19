import { BILLING_CATALOG_KEYS, getBillingCatalogEntryByKey, type PaidPlanKey } from "../config/billing-catalog";
import type { BillingCycle } from "../config/plans";

export interface ConfiguredPaystackPlan {
    key: PaidPlanKey;
    envVarName: string;
    planCode: string | null;
    amountCents: number;
    currency: "ZAR";
    interval: "monthly" | "annually";
}

export interface PaystackPlanValidationIssue {
    key: PaidPlanKey;
    envVarName: string;
    planCode: string | null;
    message: string;
}

export interface PaystackPlanValidationSnapshot {
    ok: boolean;
    issues: PaystackPlanValidationIssue[];
}

interface PaystackPlanApiResponse {
    status?: boolean;
    message?: string;
    data?: {
        plan_code?: string;
        amount?: number | string;
        interval?: string;
        currency?: string;
    };
}

export function getConfiguredPaystackPlans(envValues: Record<string, string | undefined | null>): ConfiguredPaystackPlan[] {
    return BILLING_CATALOG_KEYS.map((key) => {
        const entry = getBillingCatalogEntryByKey(key);
        return {
            key,
            envVarName: entry.envVarName,
            planCode: envValues[entry.envVarName]?.trim() || null,
            amountCents: entry.amountCents,
            currency: entry.currency,
            interval: entry.interval,
        };
    });
}

function normalizeInterval(value: string | undefined | null): string {
    return (value || "").trim().toLowerCase();
}

function normalizeAmount(value: number | string | undefined | null): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.round(value);
    }
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.round(parsed) : null;
    }
    return null;
}

export async function validateConfiguredPaystackPlans(
    envValues: Record<string, string | undefined | null>,
    fetchPlan: (planCode: string) => Promise<PaystackPlanApiResponse>,
): Promise<PaystackPlanValidationSnapshot> {
    const issues: PaystackPlanValidationIssue[] = [];

    for (const plan of getConfiguredPaystackPlans(envValues)) {
        if (!plan.planCode) {
            issues.push({
                key: plan.key,
                envVarName: plan.envVarName,
                planCode: null,
                message: `${plan.envVarName} is missing.`,
            });
            continue;
        }

        const response = await fetchPlan(plan.planCode);
        if (!response.status || !response.data) {
            issues.push({
                key: plan.key,
                envVarName: plan.envVarName,
                planCode: plan.planCode,
                message: response.message || "Paystack plan lookup failed.",
            });
            continue;
        }

        const apiAmount = normalizeAmount(response.data.amount);
        const apiInterval = normalizeInterval(response.data.interval);
        const apiCurrency = (response.data.currency || "").trim().toUpperCase();

        if (apiAmount !== plan.amountCents) {
            issues.push({
                key: plan.key,
                envVarName: plan.envVarName,
                planCode: plan.planCode,
                message: `Expected amount ${plan.amountCents}, received ${apiAmount ?? "unknown"}.`,
            });
        }

        if (apiInterval !== plan.interval) {
            issues.push({
                key: plan.key,
                envVarName: plan.envVarName,
                planCode: plan.planCode,
                message: `Expected interval ${plan.interval}, received ${apiInterval || "unknown"}.`,
            });
        }

        if (apiCurrency !== plan.currency) {
            issues.push({
                key: plan.key,
                envVarName: plan.envVarName,
                planCode: plan.planCode,
                message: `Expected currency ${plan.currency}, received ${apiCurrency || "unknown"}.`,
            });
        }
    }

    return {
        ok: issues.length === 0,
        issues,
    };
}

export function toPaystackPlanInterval(billingCycle: BillingCycle): "monthly" | "annually" {
    return billingCycle === "monthly" ? "monthly" : "annually";
}
