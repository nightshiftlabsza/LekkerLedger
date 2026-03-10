"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import {
    MarketingBillingToggle,
    MarketingPlanCards,
    PricingComparisonTable,
} from "@/components/marketing/pricing";
import {
    PRICING_PAGE_NUDGE_BODY,
    PRICING_PAGE_NUDGE_TITLE,
    PRICING_PAGE_SUBTITLE,
    PRICING_PAGE_TITLE,
} from "@/src/config/pricing-display";
import { REFUND_POLICY_SUMMARY } from "@/src/config/plans";
import { useMarketingBillingCycle } from "@/src/lib/use-marketing-billing-cycle";

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useMarketingBillingCycle();

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <section className="border-b border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Household pricing
                            </div>
                            <h1 className="type-h1 max-w-[18ch]" style={{ color: "var(--text)" }}>
                                {PRICING_PAGE_TITLE}
                            </h1>
                            <p className="max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                {PRICING_PAGE_SUBTITLE}
                            </p>
                            <MarketingBillingToggle billingCycle={billingCycle} onChange={setBillingCycle} align="center" />
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <MarketingPlanCards billingCycle={billingCycle} />
                    </div>
                </section>

                <section className="border-y border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-10 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] px-6 py-6 text-center shadow-[var(--shadow-1)]">
                            <p className="text-base font-black" style={{ color: "var(--text)" }}>
                                {PRICING_PAGE_NUDGE_TITLE}
                            </p>
                            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                {PRICING_PAGE_NUDGE_BODY}
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mb-8 max-w-2xl space-y-3">
                            <h2 className="type-h2" style={{ color: "var(--text)" }}>
                                Compare plans in detail.
                            </h2>
                            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                The comparison below shows exactly what changes as you move from basic payslips to organised records, backup, and longer history.
                            </p>
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
                                        Free has no billing. Standard and Pro cost R1 for your first 14 days — cancel before then and pay nothing more. After that, they renew monthly or yearly.
                                    </p>
                                    <p>
                                        {REFUND_POLICY_SUMMARY}
                                    </p>
                                    <p>
                                        Each successful referral that reaches its first real paid month earns the referrer 1 extra free month, up to 12 months total.
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
                                        Records stay on your device by default. Paid plans can add backup in the Google Drive app-data area in your own Google account.
                                    </p>
                                    <p>
                                        Standard and Pro include the documents hub. Pro adds the Vault, automatic backups, year-end summaries, and longer browsable history.
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
        </div>
    );
}
