"use client";

import Link from "next/link";
import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, type BillingCycle, type PlanId } from "@/src/config/plans";
import {
    getMarketingPlanHref,
    getMarketingPriceDisplay,
    MARKETING_PLAN_DISPLAY,
    MARKETING_YEARLY_BADGE,
    PRICING_COMPARISON_GROUPS,
} from "@/src/config/pricing-display";

function FeatureValue({ value }: { value: boolean | string }) {
    if (value === true) {
        return <Check className="mx-auto h-4 w-4 text-[var(--primary)]" />;
    }

    if (value === false) {
        return <span style={{ color: "var(--text-muted)" }}>-</span>;
    }

    return <span>{value}</span>;
}

export function MarketingBillingToggle({
    billingCycle,
    onChange,
    align = "left",
}: {
    billingCycle: BillingCycle;
    onChange: (cycle: BillingCycle) => void;
    align?: "left" | "center" | "right";
}) {
    const alignmentClass = align === "center" ? "items-center" : align === "right" ? "items-end" : "items-start";

    return (
        <div className={`flex flex-col gap-2 ${alignmentClass}`}>
            <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-1)]">
                    {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                        <button
                            key={cycle}
                            type="button"
                            onClick={() => onChange(cycle)}
                            className="rounded-full px-5 py-2.5 text-sm font-bold transition-all focus-visible:outline-none"
                            style={{
                                backgroundColor: billingCycle === cycle ? "var(--primary)" : "transparent",
                                color: billingCycle === cycle ? "#ffffff" : "var(--text-muted)",
                            }}
                        >
                            {cycle === "monthly" ? "Monthly" : "Yearly"}
                        </button>
                    ))}
                </div>
                {billingCycle === "yearly" ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        {MARKETING_YEARLY_BADGE}
                    </span>
                ) : null}
            </div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                All prices are in ZAR.
            </p>
        </div>
    );
}

export function MarketingPlanCards({
    billingCycle,
    compact = false,
}: {
    billingCycle: BillingCycle;
    compact?: boolean;
}) {
    return (
        <div className={`grid gap-4 ${compact ? "lg:grid-cols-3" : "xl:grid-cols-3"}`}>
            {PLAN_ORDER.map((planId) => (
                <MarketingPlanCard key={planId} planId={planId} billingCycle={billingCycle} compact={compact} />
            ))}
        </div>
    );
}

export function MarketingPlanCard({
    planId,
    billingCycle,
    compact = false,
}: {
    planId: PlanId;
    billingCycle: BillingCycle;
    compact?: boolean;
}) {
    const plan = MARKETING_PLAN_DISPLAY[planId];
    const featured = planId === "standard";
    const priceDisplay = getMarketingPriceDisplay(planId, billingCycle);
    const href = getMarketingPlanHref(planId, billingCycle);

    return (
        <article
            className={`flex h-full flex-col rounded-[28px] border bg-[var(--surface-1)] ${
                featured ? "border-2 border-[var(--primary)] shadow-[var(--shadow-2)]" : "border-[var(--border)] shadow-[var(--shadow-1)]"
            } ${compact ? "p-5" : "p-7"}`}
        >
            <div className="flex flex-1 flex-col space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[18rem] space-y-2">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            {plan.label}
                        </p>
                        <h2 className={`${compact ? "text-xl" : "text-2xl"} font-black`} style={{ color: "var(--text)" }}>
                            {plan.headline}
                        </h2>
                        <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                            {plan.subtitle}
                        </p>
                    </div>
                    {plan.badge ? (
                        <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                plan.badgeTone === "primary" ? "bg-[var(--text)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"
                            }`}
                        >
                            {plan.badge}
                        </span>
                    ) : null}
                </div>

                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                    <div className="flex items-end gap-2">
                        <span className={`${compact ? "text-4xl" : "text-5xl"} font-semibold type-mono`} style={{ color: "var(--text)" }}>
                            {priceDisplay.primary}
                        </span>
                        {priceDisplay.periodLabel ? (
                            <span className="pb-1 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                {priceDisplay.periodLabel}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        {priceDisplay.helperText}
                    </p>
                </div>

                {plan.featureIntro ? (
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                        {plan.featureIntro}
                    </p>
                ) : null}

                <ul className="space-y-3">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`mt-8 space-y-3 border-t border-[var(--border)] ${compact ? "pt-5" : "pt-6"}`}>
                <Link href={href}>
                    <Button
                        className={`w-full justify-center font-bold ${
                            planId === "free" ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]" : ""
                        }`}
                        variant={planId === "free" ? "default" : "outline"}
                    >
                        {plan.ctaLabel}
                    </Button>
                </Link>
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">{plan.ctaSubtext}</p>
            </div>
        </article>
    );
}

export function PricingComparisonTable() {
    return (
        <div className="overflow-x-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
            <table className="min-w-[720px] w-full border-collapse">
                <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-left text-xs font-black uppercase tracking-[0.16em]">
                        <th className="px-6 py-4" style={{ color: "var(--text-muted)" }}>Feature</th>
                        <th className="px-6 py-4 text-center" style={{ color: "var(--text-muted)" }}>Free</th>
                        <th className="border-x border-[var(--border)] bg-[var(--primary)]/5 px-6 py-4 text-center" style={{ color: "var(--text-muted)" }}>Standard</th>
                        <th className="px-6 py-4 text-center" style={{ color: "var(--text-muted)" }}>Pro</th>
                    </tr>
                </thead>
                <tbody>
                    {PRICING_COMPARISON_GROUPS.map((group) => (
                        <React.Fragment key={group.title}>
                            <tr key={`${group.title}-header`}>
                                <td
                                    colSpan={4}
                                    className="border-y border-[var(--border)] bg-[var(--surface-raised)] px-6 py-3 text-xs font-black uppercase tracking-[0.16em]"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    {group.title}
                                </td>
                            </tr>
                            {group.rows.map((row, index) => (
                                <tr
                                    key={`${group.title}-${row.label}`}
                                    className={`border-b border-[var(--border)] ${
                                        index % 2 === 0 ? "bg-transparent" : "bg-[var(--surface-raised)]/45"
                                    }`}
                                >
                                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                                        {row.label}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                                        <FeatureValue value={row.values.free} />
                                    </td>
                                    <td className="border-x border-[var(--border)] bg-[var(--primary)]/5 px-6 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                                        <FeatureValue value={row.values.standard} />
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                                        <FeatureValue value={row.values.pro} />
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
