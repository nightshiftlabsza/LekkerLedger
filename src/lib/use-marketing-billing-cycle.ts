"use client";

import * as React from "react";
import { type BillingCycle } from "@/src/config/plans";
import { MARKETING_BILLING_CYCLE_STORAGE_KEY } from "@/src/config/pricing-display";

function readStoredBillingCycle(): BillingCycle {
    if (typeof window === "undefined") {
        return "monthly";
    }

    const storedValue = window.sessionStorage.getItem(MARKETING_BILLING_CYCLE_STORAGE_KEY);
    return storedValue === "yearly" ? "yearly" : "monthly";
}

export function useMarketingBillingCycle(): readonly [BillingCycle, (cycle: BillingCycle) => void] {
    const [billingCycle, setBillingCycleState] = React.useState<BillingCycle>("monthly");

    React.useEffect(() => {
        setBillingCycleState(readStoredBillingCycle());
    }, []);

    const setBillingCycle = React.useCallback((cycle: BillingCycle) => {
        setBillingCycleState(cycle);

        if (typeof window !== "undefined") {
            window.sessionStorage.setItem(MARKETING_BILLING_CYCLE_STORAGE_KEY, cycle);
        }
    }, []);

    return [billingCycle, setBillingCycle] as const;
}
