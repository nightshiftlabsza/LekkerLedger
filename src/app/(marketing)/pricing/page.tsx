"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, type BillingCycle, getPlanPricePresentation } from "@/src/config/plans";

const INCLUDED_IN_EVERY_PLAN = [
    "Monthly payroll workflow",
    "Payslip preview and PDF download",
    "UIF shown clearly on payslips",
    "Built for South African domestic employers",
] as const;

const COMPARISON_GROUPS = [
    {
        title: "Coverage",
        rows: [
            { label: "Active employees", values: { free: "1", standard: "Up to 3", pro: "Unlimited" } },
            { label: "Households you can manage", values: { free: "1", standard: "1", pro: "Multiple" } },
            { label: "Archive access", values: { free: "3 months", standard: "12 months", pro: "5 years" } },
        ],
    },
    {
        title: "Core Payroll",
        rows: [
            { label: "Monthly payroll workflow", values: { free: true, standard: true, pro: true } },
            { label: "Payslip preview and PDF download", values: { free: true, standard: true, pro: true } },
            { label: "Leave tracking", values: { free: false, standard: true, pro: true } },
            { label: "Annual return (ROE) PDFs and CSVs", values: { free: false, standard: true, pro: true } },
        ],
    },
    {
        title: "Records & Paperwork",
        rows: [
            { label: "Contract drafts", values: { free: false, standard: true, pro: true } },
            { label: "Documents hub", values: { free: false, standard: true, pro: true } },
            { label: "uFiling CSV export", values: { free: false, standard: true, pro: true } },
        ],
    },
    {
        title: "Storage & Backup",
        rows: [
            { label: "Stored on this device", values: { free: true, standard: true, pro: true } },
            { label: "Private Google Drive backup", values: { free: false, standard: true, pro: true } },
            { label: "Manual document uploads", values: { free: false, standard: true, pro: true } },
        ],
    },
    {
        title: "Household Control",
        rows: [
            { label: "Unlimited employees when you grow", values: { free: false, standard: false, pro: true } },
            { label: "Multiple households (for example: main home + holiday home)", values: { free: false, standard: false, pro: true } },
        ],
    },
] as const;

function FeatureValue({ value }: { value: boolean | string }) {
    if (value === true) {
        return <Check className="mx-auto h-4 w-4 text-[var(--primary)]" />;
    }

    if (value === false) {
        return <span style={{ color: "var(--text-muted)" }}>-</span>;
    }

    return <span>{value}</span>;
}

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("yearly");

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <section className="border-b border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Household pricing
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Payslips, paperwork, and household payroll records in one place.
                            </h1>
                            <p className="mx-auto max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Start free with basic payslips. Standard is the normal paid plan for proper records, private backup, and annual paperwork. Pro adds more headroom for larger setups or for managing more than one household, like a main home and a holiday home.
                            </p>
                            <p className="mx-auto max-w-2xl text-sm font-semibold leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Built-in checks cover common household-employer rules. Always review unusual cases against official guidance.
                            </p>

                            <div className="space-y-2">
                                <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-1)]">
                                    {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                                        <button
                                            key={cycle}
                                            type="button"
                                            onClick={() => setBillingCycle(cycle)}
                                            className="rounded-full px-5 py-2.5 text-sm font-bold transition-all"
                                            style={{
                                                backgroundColor: billingCycle === cycle ? "var(--primary)" : "transparent",
                                                color: billingCycle === cycle ? "#ffffff" : "var(--text-muted)",
                                            }}
                                        >
                                            {cycle === "monthly" ? "Monthly" : "Yearly"}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                    Yearly lowers the monthly cost on paid plans.
                                </p>
                                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                    All prices are in ZAR. No VAT will be added at checkout because LekkerLedger is not currently VAT-registered.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <div className="grid gap-6 xl:grid-cols-3">
                            {PLAN_ORDER.map((planId) => {
                                const plan = PLANS[planId];
                                const featured = plan.id === "standard";
                                const cycle = plan.id === "free" ? "monthly" : billingCycle;
                                const pricePresentation = getPlanPricePresentation(plan, cycle);

                                return (
                                    <article
                                        key={plan.id}
                                        className={`flex flex-col rounded-[28px] border p-7 ${featured ? "border-[var(--primary)] shadow-[var(--shadow-2)]" : "border-[var(--border)] shadow-[var(--shadow-1)]"}`}
                                        style={{ backgroundColor: "var(--surface-1)" }}
                                    >
                                        <div className="space-y-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                                        {plan.label}
                                                    </p>
                                                    <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--text)" }}>
                                                        {plan.bestFor}
                                                    </h2>
                                                </div>
                                                {plan.badge && (
                                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${featured ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                        {plan.badge}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                                                <div className="flex items-end gap-2">
                                                    <span className="text-5xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                        {pricePresentation.primaryPrice}
                                                    </span>
                                                    {pricePresentation.periodLabel ? (
                                                        <span className="pb-1 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                                            {pricePresentation.periodLabel}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                                    {pricePresentation.helperText}
                                                </p>
                                            </div>

                                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                                {plan.description}
                                            </p>

                                            <ul className="space-y-3">
                                                {plan.marketingBullets.map((bullet) => (
                                                    <li key={bullet} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                        <span>{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-8 space-y-3 border-t border-[var(--border)] pt-6">
                                            <Link href="/onboarding">
                                                <Button className="w-full justify-center font-bold">
                                                    {plan.id === "free" ? "Start free" : `Choose ${plan.label}`}
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {plan.id === "free" ? (
                                                <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                                                    No account needed for Free. Paid backup uses your Google account.
                                                </p>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                                                        14-day refund on paid upgrades.
                                                    </p>
                                                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                                                        Cancel anytime. Access continues until the end of your billing period.
                                                    </p>
                                                </div>
                                            )}
                                            <Link href="/examples" className="inline-flex items-center text-[11px] font-semibold text-[var(--primary)] hover:underline">
                                                See example PDF
                                            </Link>
                                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                                {plan.id === "free"
                                                    ? "A simple starting point for one worker and basic monthly payslips."
                                                    : plan.id === "standard"
                                                        ? "The paid plan for most households that want proper records and backup."
                                                        : "Best when you need more than one household, like a main home and a holiday home, plus longer archive access and more headroom."}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="border-y border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                    Included in every plan
                                </p>
                                <ul className="mt-5 space-y-3">
                                    {INCLUDED_IN_EVERY_PLAN.map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-[28px] border border-[var(--primary)] bg-[var(--primary)]/5 p-7 shadow-[var(--shadow-1)]">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <h2 className="type-h3" style={{ color: "var(--text)" }}>
                                        Built for South African domestic employers
                                    </h2>
                                </div>
                                <div className="mt-5 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        Free is for basic payslips. Standard is where proper household records start. Pro adds scale, multiple households, and longer-running archive access.
                                    </p>
                                    <p>
                                        Multiple households simply means separate record spaces when you need them, for example a main home and a holiday home, or helping a family member keep one worker&apos;s records tidy.
                                    </p>
                                    <p>
                                        Records stay on this device by default. Paid backup goes into your own private Google Drive app-data area, not a central LekkerLedger employee database.
                                    </p>
                                    <p>
                                        No account is needed for Free. Paid plans are confirmed through your Google sign-in so you can reconnect on another device later.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <h2 className="type-h2" style={{ color: "var(--text)" }}>
                                    Compare the plans in more detail.
                                </h2>
                                <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    The table below focuses on what actually changes when you move from basic payslips to fuller records, backup, and larger household control.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4 text-sm leading-relaxed shadow-[var(--shadow-1)]" style={{ color: "var(--text-muted)" }}>
                                <strong style={{ color: "var(--text)" }}>Quick read:</strong> Standard is the default paid plan. Pro is mainly for more headroom, deeper archive access, and cases where you need to keep separate records for more than one household.
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
                            <div className="hidden grid-cols-[1.5fr_repeat(3,1fr)] border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4 text-xs font-black uppercase tracking-[0.16em] md:grid" style={{ color: "var(--text-muted)" }}>
                                <div>Feature</div>
                                <div className="text-center">Free</div>
                                <div className="text-center">Standard</div>
                                <div className="text-center">Pro</div>
                            </div>

                            {COMPARISON_GROUPS.map((group) => (
                                <div key={group.title} className="border-b border-[var(--border)] last:border-b-0">
                                    <div className="bg-[var(--surface-raised)] px-6 py-4 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                        {group.title}
                                    </div>
                                    {group.rows.map((row) => (
                                        <div key={row.label} className="grid gap-4 border-t border-[var(--border)] px-6 py-4 md:grid-cols-[1.5fr_repeat(3,1fr)] md:items-center">
                                            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{row.label}</div>
                                            <div className="flex items-center justify-between text-sm md:block md:text-center" style={{ color: "var(--text-muted)" }}>
                                                <span className="md:hidden font-bold" style={{ color: "var(--text)" }}>Free</span>
                                                <FeatureValue value={row.values.free} />
                                            </div>
                                            <div className="flex items-center justify-between text-sm md:block md:text-center" style={{ color: "var(--text-muted)" }}>
                                                <span className="md:hidden font-bold" style={{ color: "var(--text)" }}>Standard</span>
                                                <FeatureValue value={row.values.standard} />
                                            </div>
                                            <div className="flex items-center justify-between text-sm md:block md:text-center" style={{ color: "var(--text-muted)" }}>
                                                <span className="md:hidden font-bold" style={{ color: "var(--text)" }}>Pro</span>
                                                <FeatureValue value={row.values.pro} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h3 className="type-h3 mb-4" style={{ color: "var(--text)" }}>
                                    Billing and refunds
                                </h3>
                                <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        Free has no monthly or yearly billing. Standard and Pro can be paid monthly or yearly, and the yearly view shows the lower effective monthly cost without percentage callouts.
                                    </p>
                                    <p>
                                        All prices are in ZAR. No VAT will be added at checkout because LekkerLedger is not currently VAT-registered.
                                    </p>
                                    <p>
                                        If you request a refund within 14 days of purchase, we&apos;ll refund you in full. That keeps the decision low-risk without turning the page into a hard-sell funnel.
                                    </p>
                                    <Link href="/legal/refunds" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                                        View the refund policy <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h3 className="type-h3 mb-4" style={{ color: "var(--text)" }}>
                                    How upgrades work
                                </h3>
                                <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        1. Choose Standard or Pro and pay securely through Paystack.
                                    </p>
                                    <p>
                                        2. Free stays local with no account needed. For paid plans, LekkerLedger confirms your paid access through your Google sign-in, not through one browser alone.
                                    </p>
                                    <p>
                                        3. Paid features then unlock on this device, and optional backup uses your own private Google Drive app-data area.
                                    </p>
                                    <p>
                                        4. If you change devices later, reconnect the same Google account to restore your backup and confirm your paid access again.
                                    </p>
                                    <p>
                                        Standard adds the records and paperwork most households eventually need: leave tracking, contracts, document storage, backup, exports, and annual Return of Earnings (ROE) downloads for Compensation Fund preparation. Pro mainly adds more room with multiple households, unlimited employees, and longer archive access.
                                    </p>
                                    <p>
                                        In plain terms, Pro is for cases like a main home plus a holiday home, or helping a family member manage a separate worker record set without mixing everything together.
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
