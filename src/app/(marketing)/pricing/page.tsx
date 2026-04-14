"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import {
    MarketingBillingToggle,
    MarketingPlanCards,
    PricingComparisonTable,
} from "@/components/marketing/pricing";
import { useInlinePaidPlanCheckout } from "@/components/billing/inline-paid-plan-checkout";
import { REFUND_POLICY_SUMMARY } from "@/src/config/plans";
import { useMarketingBillingCycle } from "@/src/lib/use-marketing-billing-cycle";

const PRICING_PAGE_TITLE = "Pricing for domestic worker payslips, UIF, and payroll records";
const PRICING_PAGE_SUBTITLE = "Get your first payslip free, or pay now for Standard or Pro dashboard access.";
const PRICING_PAGE_NUDGE_TITLE = "Choose Pro only if you need more storage, more history, or multiple households";
const PRICING_PAGE_NUDGE_BODY = "Standard is the ongoing monthly option for household employers who want leave tracking, records, and UIF-ready admin. Pro adds full document storage, year-end summaries, and 5 years of searchable history.";
const PRICING_PAGE_PLAN_DISPLAY_OVERRIDES = {
    free: {
        headline: "Get your first payslip free",
        subtitle: "No account needed for your first sample. We’ll email the PDF to you.",
    },
    standard: {
        headline: "For monthly household payroll.",
        subtitle: "Payslips, leave, contracts, organised records, and automatic private backup for a household employer who needs payroll done properly.",
        badge: "Launch pricing",
        launchNote: undefined,
    },
    pro: {
        headline: "For long-term records and more control.",
        subtitle: "Advanced document tools, full storage, longer history, and support for more complexity.",
        badge: "Launch pricing",
        launchNote: undefined,
    },
} as const;

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useMarketingBillingCycle();
    const { startCheckout, loadingPlanId, dialog, warmCheckout } = useInlinePaidPlanCheckout({ billingCycle });

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <section className="border-b border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                            <div className="max-w-3xl space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                    Household pricing
                                </div>
                                <h1 className="type-h1 max-w-[26ch]" style={{ color: "var(--text)" }}>
                                    {PRICING_PAGE_TITLE}
                                </h1>
                                <p className="max-w-[60ch] text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    {PRICING_PAGE_SUBTITLE}
                                </p>
                            </div>
                            <div className="lg:justify-self-end">
                                <MarketingBillingToggle billingCycle={billingCycle} onChange={setBillingCycle} align="right" />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <MarketingPlanCards
                            billingCycle={billingCycle}
                            onSelect={startCheckout}
                            onWarmSelect={warmCheckout}
                            isLoadingPlanId={loadingPlanId}
                            planDisplayOverrides={PRICING_PAGE_PLAN_DISPLAY_OVERRIDES}
                        />
                    </div>
                </section>

                <section className="border-y border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-10 sm:px-6 lg:px-8">
                        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] px-6 py-6 text-center shadow-[var(--shadow-1)] lg:px-10">
                            <p className="text-base font-black" style={{ color: "var(--text)" }}>
                                {PRICING_PAGE_NUDGE_TITLE}
                            </p>
                            <p className="mx-auto mt-2 max-w-[62ch] text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                {PRICING_PAGE_NUDGE_BODY}
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-3">
                                <h2 className="type-h2" style={{ color: "var(--text)" }}>
                                    Compare Free, Standard, and Pro in detail.
                                </h2>
                                <p className="max-w-[62ch] text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Use this table if you are choosing between a first free sample, one-household payroll admin, or longer records with more file storage.
                                </p>
                            </div>
                        </div>
                        <PricingComparisonTable />
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 pb-16 sm:px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h3 className="type-h3 mb-4" style={{ color: "var(--text)" }}>
                                    Billing and refunds
                                </h3>
                                <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        Free has no billing. Standard and Pro start billing right away on the monthly or yearly cycle you choose.
                                    </p>
                                    <p>
                                        {REFUND_POLICY_SUMMARY}
                                    </p>
                                    <p>
                                        Referral rewards apply after the referred account reaches its first full paid month and clears the refund window.
                                    </p>
                                    <Link href="/legal/refunds" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                                        View the refund policy <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h3 className="type-h3 mb-4" style={{ color: "var(--text)" }}>
                                    Storage and support
                                </h3>
                                <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        Paid accounts keep records in Cloud-secured storage you can access from any device. Free sends one first payslip sample per email address with no account needed.
                                    </p>
                                    <p>
                                        Standard and Pro include the documents hub and Cloud-secured storage. Pro adds the Vault for employment files, year-end summaries, and 5 years of payroll records.
                                    </p>
                                    <p>
                                        Support is by email on every plan, with faster replies on Pro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            {dialog}
        </div>
    );
}
