"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, type BillingCycle, getPlanDisplayPrice, getPlanPeriodLabel, getPlanSavings, getPlanSavingsLabel } from "@/src/config/plans";

const COMPARISON_GROUPS = [
    {
        title: "Coverage",
        rows: [
            { label: "Active employees", values: { free: "1", standard: "Up to 3", pro: "Unlimited" } },
            { label: "Household workspaces", values: { free: "1", standard: "1", pro: "Multiple" } },
            { label: "Archive window", values: { free: "3 months", standard: "12 months", pro: "5 years" } },
        ],
    },
    {
        title: "Payroll and documents",
        rows: [
            { label: "Payslip generation", values: { free: true, standard: true, pro: true } },
            { label: "Contract generator", values: { free: false, standard: true, pro: true } },
            { label: "uFiling export", values: { free: false, standard: true, pro: true } },
            { label: "Annual COIDA ROE pack", values: { free: "Copy-ready numbers", standard: true, pro: true } },
        ],
    },
    {
        title: "Storage and control",
        rows: [
            { label: "Google Drive backup", values: { free: false, standard: true, pro: true } },
            { label: "Leave and loan tracking", values: { free: false, standard: false, pro: true } },
            { label: "Multi-household switching", values: { free: false, standard: false, pro: true } },
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
                                Proper payroll records for South African households, without enterprise software pricing.
                            </h1>
                            <p className="mx-auto max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Start free, then choose the level of backup, archive depth, and household control you need. Yearly plans keep the cost lower if this has become part of your normal monthly admin, and both paid tiers still sit well below typical managed payroll pricing.
                            </p>

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
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <div className="grid gap-6 xl:grid-cols-3">
                            {PLAN_ORDER.map((planId) => {
                                const plan = PLANS[planId];
                                const featured = plan.id === "pro";
                                const savings = getPlanSavings(plan);
                                const cycle = plan.id === "free" ? "yearly" : billingCycle;
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
                                                        {getPlanDisplayPrice(plan, cycle)}
                                                    </span>
                                                    <span className="pb-1 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                                        {getPlanPeriodLabel(plan, cycle)}
                                                    </span>
                                                </div>
                                                {plan.pricing.yearly && savings && (
                                                    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                                        {billingCycle === "yearly"
                                                            ? `${getPlanSavingsLabel(plan)} • Save R${savings.amount} over 12 months`
                                                            : `Yearly works out cheaper: ${getPlanDisplayPrice(plan, "yearly")}/year`}
                                                    </p>
                                                )}
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
                                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                                {plan.id === "free"
                                                    ? "A calm starting point for one household that wants clean records from day one."
                                                    : plan.id === "standard"
                                                        ? "Often lower than a single month of a managed household payroll service."
                                                        : "Built for anyone managing multiple homes, family employers, or a growing payroll archive."}
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
                        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <h2 className="type-h2" style={{ color: "var(--text)" }}>
                                    Clear feature differences, so households can self-select fast.
                                </h2>
                                <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    The paid plans are designed to reduce the time, clean-up work, and risk of missing something once your records need to be shared, archived, or revisited.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4 text-sm leading-relaxed shadow-[var(--shadow-1)]" style={{ color: "var(--text-muted)" }}>
                                <strong style={{ color: "var(--text)" }}>Quiet reassurance:</strong> the goal is not to scare you. The goal is to help you stay organised before a routine payroll or compliance request turns into an expensive clean-up.
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
                                        Free stays free. Standard and Pro are available as monthly or yearly plans, and the yearly option lowers the effective monthly cost.
                                    </p>
                                    <p>
                                        If you request a refund within 14 days of purchase, we'll refund you in full. That keeps the decision low-risk without cluttering the page with hard-sell language.
                                    </p>
                                    <Link href="/legal/refunds" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                                        View the refund policy <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[var(--primary)] bg-[var(--primary)]/5 p-7 shadow-[var(--shadow-1)]">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <h3 className="type-h3" style={{ color: "var(--text)" }}>
                                        Why people pay for this
                                    </h3>
                                </div>
                                <div className="mt-5 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        Not because payroll should feel frightening. But because the rules are real, and when records are missing, inconsistent, or hard to find, the tidy-up work usually costs more than doing it properly once.
                                    </p>
                                    <p>
                                        LekkerLedger is priced for households that want calm, defensible records without paying the kind of monthly fee commonly charged by managed payroll services or enterprise tools.
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

