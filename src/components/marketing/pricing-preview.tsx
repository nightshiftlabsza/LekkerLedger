"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useInlinePaidPlanCheckout } from "@/components/billing/inline-paid-plan-checkout";
import { MarketingBillingToggle, MarketingPlanCards } from "@/components/marketing/pricing";
import { HOMEPAGE_PRICING_LINK_LABEL, PRICING_PAGE_SUBTITLE, PRICING_PAGE_TITLE } from "@/src/config/pricing-display";
import { useMarketingBillingCycle } from "@/src/lib/use-marketing-billing-cycle";

export function PricingPreview() {
    const [billingCycle, setBillingCycle] = useMarketingBillingCycle();
    const { startCheckout, loadingPlanId, dialog, warmCheckout } = useInlinePaidPlanCheckout({ billingCycle });

    return (
        <section id="pricing-preview" className="scroll-mt-24" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="marketing-shell marketing-section">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Pricing preview
                        </p>
                        <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                            {PRICING_PAGE_TITLE}
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            {PRICING_PAGE_SUBTITLE}
                        </p>
                    </div>

                    <MarketingBillingToggle billingCycle={billingCycle} onChange={setBillingCycle} align="right" />
                </div>

                <div className="mt-6">
                    <MarketingPlanCards
                        billingCycle={billingCycle}
                        compact
                        onSelect={startCheckout}
                        onWarmSelect={warmCheckout}
                        isLoadingPlanId={loadingPlanId}
                    />
                </div>

                <div className="mt-8 flex justify-start sm:justify-end">
                    <Link href="/pricing" aria-label="See full pricing" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                        {HOMEPAGE_PRICING_LINK_LABEL} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
            {dialog}
        </section>
    );
}
