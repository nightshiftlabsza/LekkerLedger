import { describe, expect, it } from "vitest";
import { getConfiguredPaystackPlans, validateConfiguredPaystackPlans } from "./paystack-plan-validation";

describe("paystack plan validation", () => {
    const envValues = {
        PAYSTACK_PLAN_STANDARD_MONTHLY: "PLN_ewoz0cglt1eboey",
        PAYSTACK_PLAN_STANDARD_YEARLY: "PLN_cf0rxo4g9hgryms",
        PAYSTACK_PLAN_PRO_MONTHLY: "PLN_bewop6oa66of19i",
        PAYSTACK_PLAN_PRO_YEARLY: "PLN_tbk0dst4cspubcc",
    };

    it("maps the exact LIVE env vars into validation inputs", () => {
        const configured = getConfiguredPaystackPlans(envValues);
        expect(configured.map((entry) => entry.envVarName)).toEqual([
            "PAYSTACK_PLAN_STANDARD_MONTHLY",
            "PAYSTACK_PLAN_STANDARD_YEARLY",
            "PAYSTACK_PLAN_PRO_MONTHLY",
            "PAYSTACK_PLAN_PRO_YEARLY",
        ]);
    });

    it("flags a stale or deleted LIVE plan code", async () => {
        const snapshot = await validateConfiguredPaystackPlans(envValues, async (planCode) => {
            if (planCode === "PLN_bewop6oa66of19i") {
                return {
                    status: false,
                    message: "Plan code is invalid",
                };
            }

            return {
                status: true,
                data: {
                    plan_code: planCode,
                    amount: planCode === "PLN_cf0rxo4g9hgryms" ? 29900 : planCode === "PLN_tbk0dst4cspubcc" ? 39900 : 2900,
                    interval: planCode === "PLN_cf0rxo4g9hgryms" || planCode === "PLN_tbk0dst4cspubcc" ? "annually" : "monthly",
                    currency: "ZAR",
                },
            };
        });

        expect(snapshot.ok).toBe(false);
        expect(snapshot.issues.some((issue) => issue.envVarName === "PAYSTACK_PLAN_PRO_MONTHLY" && issue.message.includes("Plan code is invalid"))).toBe(true);
    });
});
