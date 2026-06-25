"use client";

import Link from "next/link";
import { ArrowRight, LifeBuoy, ReceiptText, Scale } from "lucide-react";
import { useInlinePaidPlanCheckout } from "@/components/billing/inline-paid-plan-checkout";
import { MarketingBillingToggle, MarketingPlanCards } from "@/components/marketing/pricing";
import { REFUND_POLICY_SHORT_LABEL, REFUND_POLICY_SUMMARY } from "@/config/plans";
import { SUPPORT_EMAIL, SUPPORT_RESPONSE_WINDOW_SENTENCE } from "@/config/brand";
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

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:items-start">
                    <div>
                        <MarketingPlanCards
                            billingCycle={billingCycle}
                            compact
                            onSelect={startCheckout}
                            onWarmSelect={warmCheckout}
                            isLoadingPlanId={loadingPlanId}
                        />
                    </div>

                    <div className="space-y-4">
                        <aside className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Before you pay
                            </p>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/8 text-[var(--primary)]">
                                        <ReceiptText className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                            {REFUND_POLICY_SHORT_LABEL}
                                        </p>
                                        <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                            {REFUND_POLICY_SUMMARY}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/8 text-[var(--primary)]">
                                        <LifeBuoy className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                            Support stays easy to reach
                                        </p>
                                        <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[var(--primary)] hover:underline">
                                                {SUPPORT_EMAIL}
                                            </a>{" "}
                                            and {SUPPORT_RESPONSE_WINDOW_SENTENCE.toLowerCase()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/8 text-[var(--primary)]">
                                        <Scale className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                            Unusual cases still need a check
                                        </p>
                                        <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                            If the situation is unusual, verify it against official Department of Employment and Labour, uFiling, or SARS guidance before you rely on the figures.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Why this exists
                            </p>
                            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                Most household employers are not trying to run HR. They just need to handle payslips, records, and documents properly without recalculating everything or chasing paperwork every month. LekkerLedger is built to keep that monthly admin in one place.
                            </p>
                        </div>
                    </div>
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
