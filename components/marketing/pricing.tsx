"use client";

import Link from "next/link";
import * as React from "react";
import { Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, type BillingCycle, type PlanId } from "@/src/config/plans";
import {
    getMarketingPlanCtaSubtext,
    getMarketingPlanDisplay,
    getMarketingPlanFeatureSections,
    getMarketingPlanHref,
    getMarketingPriceDisplay,
    MARKETING_YEARLY_BADGE,
    PRICING_COMPARISON_GROUPS,
    isPlannedComparisonValue,
    type PricingComparisonValue,
} from "@/src/config/pricing-display";

function appendReferralCode(href: string, referralCode: string | null): string {
    if (!referralCode || !href.startsWith("/upgrade")) {
        return href;
    }

    const [pathname, existingQuery = ""] = href.split("?");
    const params = new URLSearchParams(existingQuery);
    params.set("ref", referralCode.toUpperCase());
    return `${pathname}?${params.toString()}`;
}

function FeatureValue({ value }: { value: PricingComparisonValue }) {
    if (value === true) {
        return <Check className="mx-auto h-4 w-4 text-[var(--primary)]" />;
    }

    if (value === false) {
        return <span style={{ color: "var(--text-muted)" }}>-</span>;
    }

    if (isPlannedComparisonValue(value)) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{
                    borderColor: "rgba(15, 23, 42, 0.18)",
                    backgroundColor: "rgba(15, 23, 42, 0.04)",
                    color: "var(--text-muted)",
                }}
            >
                <Clock3 className="h-3 w-3" />
                {value.label}
            </span>
        );
    }

    return <span>{value}</span>;
}

function getFeatureValueLabel(value: PricingComparisonValue) {
    if (value === true) return "Included";
    if (value === false) return "Not included";
    if (isPlannedComparisonValue(value)) return value.label;
    return value;
}

const COMPARISON_PLAN_LABELS: Record<PlanId, string> = {
    free: "Free",
    standard: "Standard",
    pro: "Pro",
};

// ─── Billing Toggle ────────────────────────────────────────────────────────────

export function MarketingBillingToggle({
    billingCycle,
    onChange,
    align = "center",
}: {
    readonly billingCycle: BillingCycle;
    readonly onChange: (cycle: BillingCycle) => void;
    readonly align?: "left" | "center" | "right";
}) {
    let alignmentClass = "items-start";
    let justifyClass = "sm:justify-start";

    if (align === "center") {
        alignmentClass = "items-center";
        justifyClass = "sm:justify-center";
    } else if (align === "right") {
        alignmentClass = "items-end";
        justifyClass = "sm:justify-end";
    }

    return (
        <div className={`flex w-full flex-col gap-2 lg:w-auto ${alignmentClass}`}>
            {/* Toggle row */}
            <fieldset
                className={`flex flex-col items-center gap-3 sm:flex-row ${justifyClass}`}
                aria-label="Billing cycle"
            >
                {/* Pill toggle */}
                <div
                    className="inline-flex rounded-full p-1"
                    style={{
                        backgroundColor: "var(--surface-raised)",
                        border: "1.5px solid var(--border)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    }}
                >
                    {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
                        const isSelected = billingCycle === cycle;
                        return (
                            <button
                                key={cycle}
                                type="button"
                                onClick={() => onChange(cycle)}
                                aria-pressed={isSelected}
                                className="relative min-h-[44px] rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--civic-gold)] focus-visible:ring-offset-2 sm:px-6"
                                style={{
                                    backgroundColor: isSelected ? "var(--primary)" : "transparent",
                                    color: isSelected ? "#ffffff" : "var(--text-muted)",
                                    boxShadow: isSelected
                                        ? "0 2px 8px rgba(0,122,77,0.25)"
                                        : "none",
                                }}
                            >
                                {cycle === "monthly" ? "Monthly" : "Yearly"}
                                {/* Savings nudge always visible on Yearly button */}
                                {cycle === "yearly" && !isSelected && (
                                    <span
                                        className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black uppercase tracking-[0.1em]"
                                        style={{
                                            backgroundColor: "rgba(0,122,77,0.1)",
                                            color: "var(--primary)",
                                        }}
                                    >
                                        save
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Savings badge — shown when yearly is active */}
                <div className="flex h-8 items-center">
                    {billingCycle === "yearly" ? (
                        <span
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.14em] animate-in fade-in slide-in-from-left-1 duration-200"
                            style={{
                                backgroundColor: "var(--primary)",
                                color: "#ffffff",
                            }}
                            aria-live="polite"
                        >
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M5 0L6.12 3.38H9.51L6.88 5.47L7.94 8.82L5 6.88L2.06 8.82L3.12 5.47L0.49 3.38H3.88L5 0Z" />
                            </svg>
                            {MARKETING_YEARLY_BADGE}
                        </span>
                    ) : (
                        <span
                            className="inline-flex min-h-[44px] items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                            style={{
                                backgroundColor: "rgba(0,122,77,0.08)",
                                color: "var(--primary)",
                                border: "1px dashed rgba(0,122,77,0.3)",
                            }}
                            aria-label="Switch to yearly to save up to 32%"
                        >
                            {MARKETING_YEARLY_BADGE}
                        </span>
                    )}
                </div>
            </fieldset>

            {/* Currency note */}
            <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
            >
                All prices are in ZAR.
            </p>
        </div>
    );
}

// ─── Plan Cards Grid ───────────────────────────────────────────────────────────

export function MarketingPlanCards({
    billingCycle,
    compact = false,
    currentPlanId,
    onSelect,
    onWarmSelect,
    isLoadingPlanId,
}: {
    readonly billingCycle: BillingCycle;
    readonly compact?: boolean;
    readonly currentPlanId?: PlanId;
    readonly onSelect?: (planId: PlanId) => void;
    readonly onWarmSelect?: (planId: Exclude<PlanId, "free">) => void;
    readonly isLoadingPlanId?: PlanId | null;
}) {
    return (
        <div className="plan-cards-cq-root w-full space-y-6">
            <div className={`grid gap-5 md:gap-6 ${compact ? "plan-cards-compact-cq-grid" : "plan-cards-cq-grid"}`}>
                {PLAN_ORDER.map((planId) => (
                    <MarketingPlanCard
                        key={planId}
                        planId={planId}
                        billingCycle={billingCycle}
                        compact={compact}
                        isCurrent={currentPlanId === planId}
                        currentPlanId={currentPlanId}
                        onSelect={onSelect}
                        onWarmSelect={onWarmSelect}
                        isLoading={isLoadingPlanId === planId}
                        isDisabled={!!isLoadingPlanId && isLoadingPlanId !== planId}
                    />
                ))}
            </div>
            
            {!currentPlanId && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                    Already have a paid account?{" "}
                    <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
                        Log in here
                    </Link>
                </p>
            )}
        </div>
    );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────

const PLAN_RANK: Record<PlanId, number> = { free: 0, standard: 1, pro: 2 };

function getPlanCardActionLabel({
    isCurrent,
    isLoading,
    isDowngrade,
    isUpgrade,
    ctaLabel,
}: {
    isCurrent: boolean;
    isLoading: boolean;
    isDowngrade: boolean;
    isUpgrade: boolean;
    ctaLabel: string;
}) {
    if (isCurrent) return "Current plan";
    if (isLoading) return "Opening...";
    if (isDowngrade) return "Downgrade";
    if (isUpgrade) return "Upgrade";
    return ctaLabel;
}

function getPlanCardButtonStyle(featured: boolean, isCurrent: boolean, isDowngrade: boolean) {
    return !isCurrent && !isDowngrade && featured
        ? { backgroundColor: "var(--primary)" }
        : {};
}

function getPlanCardClassName(featured: boolean, isDisabled: boolean) {
    return `flex h-full flex-col overflow-hidden rounded-[30px] border bg-[var(--surface-1)] transition-all ${
        featured
            ? "border-2 border-[var(--primary)] shadow-[0_20px_50px_rgba(0,122,77,0.12)]"
            : "border-[var(--border)] shadow-[var(--shadow-1)]"
    } ${isDisabled ? "opacity-60 grayscale-[0.5]" : ""}`;
}

function getPlanCardReferralCode() {
    if (typeof window === "undefined") {
        return null;
    }

    return new URLSearchParams(window.location.search).get("ref");
}

function MarketingPlanCardCta({
    onSelect,
    href,
    handleAction,
    handleWarm,
    isCurrent,
    isDisabled,
    isLoading,
    featured,
    isDowngrade,
    ctaStyle,
    actionLabel,
    planId,
    ctaLabel,
}: {
    onSelect?: (planId: PlanId) => void;
    href: string;
    handleAction: () => void;
    handleWarm: () => void;
    isCurrent: boolean;
    isDisabled: boolean;
    isLoading: boolean;
    featured: boolean;
    isDowngrade: boolean;
    ctaStyle: React.CSSProperties;
    actionLabel: string;
    planId: PlanId;
    ctaLabel: string;
}) {
    if (onSelect) {
        return (
            <Button
                className="min-h-[48px] w-full justify-center font-bold"
                onClick={handleAction}
                onPointerEnter={handleWarm}
                onFocus={handleWarm}
                onTouchStart={handleWarm}
                disabled={isCurrent || isDisabled || isLoading}
                variant={featured && !isDowngrade ? "default" : "outline"}
                style={ctaStyle}
            >
                {actionLabel}
            </Button>
        );
    }

    return (
        <Link href={href}>
            <Button
                className={`min-h-[48px] w-full justify-center font-bold ${
                    planId === "free"
                        ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                        : ""
                }`}
                variant={planId === "free" ? "default" : "outline"}
            >
                {ctaLabel}
            </Button>
        </Link>
    );
}

function MarketingPlanCardSubtext({
    planId,
    billingCycle,
    isCurrent,
    isDowngrade,
}: {
    planId: PlanId;
    billingCycle: BillingCycle;
    isCurrent: boolean;
    isDowngrade: boolean;
}) {
    const ctaSubtext = getMarketingPlanCtaSubtext(planId, billingCycle);
    if (isCurrent || isDowngrade || !ctaSubtext) {
        return null;
    }

    return (
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {ctaSubtext}
        </p>
    );
}

export function MarketingPlanCard({
    planId,
    billingCycle,
    compact = false,
    isCurrent = false,
    currentPlanId,
    onSelect,
    onWarmSelect,
    isLoading = false,
    isDisabled = false,
}: {
    readonly planId: PlanId;
    readonly billingCycle: BillingCycle;
    readonly compact?: boolean;
    readonly isCurrent?: boolean;
    readonly currentPlanId?: PlanId;
    readonly onSelect?: (planId: PlanId) => void;
    readonly onWarmSelect?: (planId: Exclude<PlanId, "free">) => void;
    readonly isLoading?: boolean;
    readonly isDisabled?: boolean;
}) {
    const plan = getMarketingPlanDisplay(planId);
    const featured = planId === "standard";
    const priceDisplay = getMarketingPriceDisplay(planId, billingCycle);
    const isDowngrade =
        !isCurrent && !!currentPlanId && PLAN_RANK[planId] < PLAN_RANK[currentPlanId];
    const isUpgrade =
        !isCurrent && !!currentPlanId && PLAN_RANK[planId] > PLAN_RANK[currentPlanId];
    const referralCode = getPlanCardReferralCode();
    const href = appendReferralCode(getMarketingPlanHref(planId, billingCycle), referralCode);
    const actionLabel = getPlanCardActionLabel({
        isCurrent,
        isLoading,
        isDowngrade,
        isUpgrade,
        ctaLabel: plan.ctaLabel,
    });
    const ctaStyle = getPlanCardButtonStyle(featured, isCurrent, isDowngrade);

    const handleAction = () => {
        if (onSelect) {
            onSelect(planId);
        }
    };

    const handleWarm = () => {
        if (planId === "free" || !onWarmSelect) {
            return;
        }

        onWarmSelect(planId);
    };

    return (
        <article className={getPlanCardClassName(featured, isDisabled)}>
            {/* ── Card header ── */}
            <div
                className="border-b border-[var(--border)] px-5 py-4 sm:px-6"
                style={{
                    background:
                        "linear-gradient(135deg, rgba(0, 122, 77, 0.05) 0%, rgba(0, 122, 77, 0.02) 100%)",
                }}
            >
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <div className="min-w-0">
                        <p
                            className="text-xs font-black uppercase tracking-[0.2em]"
                            style={{ color: "var(--primary)" }}
                        >
                            {plan.label}
                        </p>
                        <h2
                            className={`mt-1.5 ${compact ? "text-xl" : "text-2xl"} font-black leading-tight`}
                            style={{ color: "var(--text)" }}
                        >
                            {plan.headline}
                        </h2>
                    </div>

                    {/* Early-bird badge */}
                    {plan.badge ? (
                        <EarlybirdBadge text={plan.badge} />
                    ) : null}
                </div>
            </div>

            {/* ── Card body ── */}
            <div className={`flex flex-1 flex-col ${compact ? "p-5" : "p-6 sm:p-7"} space-y-6`}>
                {/* Subtitle */}
                <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                    {plan.subtitle}
                </p>

                {/* Price block */}
                <div
                    className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5"
                >
                    <div className="flex items-end gap-2">
                        <span
                            className={`${compact ? "text-4xl" : "text-5xl"} font-semibold type-mono leading-none`}
                            style={{ color: "var(--text)" }}
                        >
                            {priceDisplay.primary}
                        </span>
                        {priceDisplay.periodLabel ? (
                            <span
                                className="pb-1 text-xs font-black uppercase tracking-[0.14em]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {priceDisplay.periodLabel}
                            </span>
                        ) : null}
                    </div>

                    {priceDisplay.helperText ? (
                        <p
                            className="mt-2.5 text-sm font-medium"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {priceDisplay.helperText}
                        </p>
                    ) : null}

                    {/* Launch pricing microcopy */}
                    {plan.launchNote ? (
                        <p
                            className="mt-2 text-xs leading-5"
                            style={{ color: "var(--text-muted)", opacity: 0.75 }}
                        >
                            {plan.launchNote}
                        </p>
                    ) : null}
                </div>

                {/* Features */}
                <PlanFeatureList planId={planId} />
            </div>

            {/* ── CTA footer ── */}
            <div
                className={`mt-auto space-y-2.5 border-t border-[var(--border)] ${compact ? "p-5" : "p-6 pb-5 sm:p-7 sm:pb-6"}`}
            >
                <MarketingPlanCardCta
                    onSelect={onSelect}
                    href={href}
                    handleAction={handleAction}
                    handleWarm={handleWarm}
                    isCurrent={isCurrent}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    featured={featured}
                    isDowngrade={isDowngrade}
                    ctaStyle={ctaStyle}
                    actionLabel={actionLabel}
                    planId={planId}
                    ctaLabel={plan.ctaLabel}
                />

                {/* Billing subtext — only on upgrade CTAs */}
                <MarketingPlanCardSubtext
                    planId={planId}
                    billingCycle={billingCycle}
                    isCurrent={isCurrent}
                    isDowngrade={isDowngrade}
                />
            </div>
        </article>
    );
}

export function PlanFeatureList({
    planId,
    className = "",
}: {
    readonly planId: PlanId;
    readonly className?: string;
}) {
    const sections = getMarketingPlanFeatureSections(planId);

    return (
        <div className={`space-y-4 ${className}`.trim()}>
            {sections.map((section) => {
                const isPlanned = section.kind === "planned";

                return (
                    <section
                        key={`${planId}-${section.kind}`}
                        aria-label={section.title}
                        data-feature-section={section.kind}
                        className={
                            isPlanned
                                ? "rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/70 p-4"
                                : ""
                        }
                    >
                        {section.title ? (
                            <p
                                className="text-xs font-black uppercase tracking-[0.16em]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {section.title}
                            </p>
                        ) : null}

                        <ul className={`${section.title ? "mt-3" : ""} space-y-3`}>
                            {section.items.map((feature) => (
                                <li
                                    key={feature}
                                    data-feature-kind={section.kind}
                                    className="flex items-start gap-3 text-sm"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    {isPlanned ? (
                                        <Clock3
                                            className="mt-0.5 h-4 w-4 shrink-0"
                                            style={{ color: "var(--text-muted)" }}
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Check
                                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <span
                                        className={`leading-5 ${isPlanned ? "font-medium" : ""}`}
                                        style={isPlanned ? { color: "var(--text)" } : undefined}
                                    >
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}

// ─── Early-bird badge ──────────────────────────────────────────────────────────

function EarlybirdBadge({ text }: { readonly text: string }) {
    return (
        <span
            className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] sm:px-2.5 sm:text-xs sm:tracking-[0.14em]"
            style={{
                backgroundColor: "rgba(196, 122, 28, 0.08)",
                border: "1px solid rgba(196, 122, 28, 0.25)",
                color: "#9A5F10",
            }}
            aria-label={text}
        >
            <svg
                width="7"
                height="7"
                viewBox="0 0 7 7"
                fill="currentColor"
                aria-hidden="true"
                className="shrink-0"
            >
                <circle cx="3.5" cy="3.5" r="3.5" />
            </svg>
            {text}
        </span>
    );
}

// ─── Comparison Table ──────────────────────────────────────────────────────────

export function PricingComparisonTable() {
    return (
        <div className="space-y-5">
            <div className="space-y-4 lg:hidden">
                {PRICING_COMPARISON_GROUPS.map((group) => (
                    <section
                        key={group.title}
                        className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)] sm:p-6"
                    >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {group.title}
                        </p>
                        <div className="mt-4 space-y-4">
                            {group.rows.map((row) => (
                                <div
                                    key={`${group.title}-${row.label}`}
                                    className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                                >
                                    <p className="text-sm font-bold text-[var(--text)]">{row.label}</p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                        {PLAN_ORDER.map((planId) => (
                                            <div
                                                key={`${row.label}-${planId}`}
                                                className={`rounded-[18px] border px-3 py-3 ${
                                                    planId === "standard"
                                                        ? "border-[var(--primary)]/25 bg-[var(--primary)]/6"
                                                        : "border-[var(--border)] bg-[var(--surface-1)]"
                                                }`}
                                            >
                                                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                                    {COMPARISON_PLAN_LABELS[planId]}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                                    {row.values[planId] === true ? (
                                                        <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                    ) : null}
                                                    <span>{getFeatureValueLabel(row.values[planId])}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="hidden overflow-x-auto rounded-[30px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)] lg:block">
                <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                        <tr
                            className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-left text-xs font-black uppercase tracking-[0.18em]"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <th
                                className="sticky left-0 z-10 bg-[var(--surface-raised)] px-6 py-5 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1),1px_0_0_0_var(--border)]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Feature
                            </th>
                            <th className="px-6 py-5 text-center" style={{ color: "var(--text-muted)" }}>
                                Free
                            </th>
                            <th
                                className="border-x border-[var(--border)] bg-[var(--primary)]/5 px-6 py-5 text-center"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Standard
                            </th>
                            <th className="px-6 py-5 text-center" style={{ color: "var(--text-muted)" }}>
                                Pro
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {PRICING_COMPARISON_GROUPS.map((group) => (
                            <React.Fragment key={group.title}>
                                <tr key={`${group.title}-header`}>
                                    <td
                                        colSpan={4}
                                        className="sticky left-0 z-10 border-y border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4 text-xs font-black uppercase tracking-[0.18em]"
                                        style={{ color: "var(--text)" }}
                                    >
                                        {group.title}
                                    </td>
                                </tr>
                                {group.rows.map((row, index) => (
                                    <tr
                                        key={`${group.title}-${row.label}`}
                                        className={`border-b border-[var(--border)] ${
                                            index % 2 === 0 ? "bg-transparent" : "bg-[var(--surface-raised)]/30"
                                        }`}
                                    >
                                        <td
                                            className={`sticky left-0 z-10 px-6 py-4 text-sm font-semibold shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1),1px_0_0_0_var(--border)] ${
                                                index % 2 === 0 ? "bg-[var(--surface-1)]" : "bg-[var(--surface-raised)]"
                                            }`}
                                            style={{ color: "var(--text)" }}
                                        >
                                            {row.label}
                                        </td>
                                        <td
                                            className="px-6 py-4 text-center text-sm"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            <FeatureValue value={row.values.free} />
                                        </td>
                                        <td
                                            className="border-x border-[var(--border)] bg-[var(--primary)]/5 px-6 py-4 text-center text-sm"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            <FeatureValue value={row.values.standard} />
                                        </td>
                                        <td
                                            className="px-6 py-4 text-center text-sm"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            <FeatureValue value={row.values.pro} />
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
