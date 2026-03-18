"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BillingCycle, type PlanId } from "@/src/config/plans";

function buildHostedCheckoutHref(input: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    referralCode?: string | null;
}) {
    const params = new URLSearchParams({
        plan: input.planId,
        cycle: input.billingCycle,
    });

    if (input.referralCode?.trim()) {
        params.set("ref", input.referralCode.trim().toUpperCase());
    }

    return `/billing/checkout?${params.toString()}`;
}

export function useInlinePaidPlanCheckout({
    billingCycle,
    referralCode,
}: {
    billingCycle: BillingCycle;
    referralCode?: string | null;
}) {
    const router = useRouter();
    const [loadingPlanId, setLoadingPlanId] = React.useState<Exclude<PlanId, "free"> | null>(null);

    const warmCheckout = React.useCallback((planId?: Exclude<PlanId, "free">) => {
        if (!planId) {
            return;
        }

        router.prefetch(buildHostedCheckoutHref({
            planId,
            billingCycle,
            referralCode,
        }));
    }, [billingCycle, referralCode, router]);

    const startCheckout = React.useCallback((planId: PlanId) => {
        if (planId === "free") {
            router.push("/resources/tools/domestic-worker-payslip");
            return;
        }

        setLoadingPlanId(planId);
        router.push(buildHostedCheckoutHref({
            planId,
            billingCycle,
            referralCode,
        }));
    }, [billingCycle, referralCode, router]);

    return {
        startCheckout,
        loadingPlanId,
        dialog: null,
        warmCheckout,
        prepareCheckout: async () => undefined,
    };
}

export function InlinePlanCheckoutButton({
    planId,
    billingCycle,
    referralCode,
    children,
    loadingLabel = "Continuing...",
    disabled,
    ...buttonProps
}: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    referralCode?: string | null;
    children: React.ReactNode;
    loadingLabel?: string;
} & React.ComponentProps<typeof Button>) {
    const { startCheckout, loadingPlanId, warmCheckout } = useInlinePaidPlanCheckout({ billingCycle, referralCode });
    const isLoading = loadingPlanId === planId;

    return (
        <Button
            type="button"
            {...buttonProps}
            disabled={disabled || isLoading}
            onClick={(event) => {
                buttonProps.onClick?.(event);
                if (event.defaultPrevented) return;
                startCheckout(planId);
            }}
            onPointerEnter={(event) => {
                buttonProps.onPointerEnter?.(event);
                warmCheckout(planId);
            }}
            onFocus={(event) => {
                buttonProps.onFocus?.(event);
                warmCheckout(planId);
            }}
            onTouchStart={(event) => {
                buttonProps.onTouchStart?.(event);
                warmCheckout(planId);
            }}
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? loadingLabel : children}
        </Button>
    );
}
