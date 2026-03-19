import { getYearlySavingsPercent } from "./billing-catalog";
import { PLANS, type BillingCycle, type PlanId } from "./plans";

export interface PriceDisplay {
    primary: string;
    periodLabel: string;
    helperText: string;
}

export interface MarketingPlanDisplay {
    label: string;
    headline: string;
    subtitle: string;
    badge?: string;
    badgeTone?: "primary" | "subtle" | "earlybird";
    /** Optional microcopy shown beneath the price block */
    launchNote?: string;
    featureIntro?: string;
    liveFeatures: string[];
    plannedFeaturesTitle?: string;
    plannedFeatures?: string[];
    ctaLabel: string;
    ctaSubtext?: string;
}

export interface PlannedComparisonValue {
    kind: "planned";
    label: string;
}

export type PricingComparisonValue = boolean | string | PlannedComparisonValue;

export interface PricingComparisonRow {
    label: string;
    values: Record<PlanId, PricingComparisonValue>;
}

export interface PricingComparisonGroup {
    title: string;
    rows: PricingComparisonRow[];
}

export const MARKETING_BILLING_CYCLE_STORAGE_KEY = "lekkerledger:marketing-billing-cycle";
export const MARKETING_YEARLY_BADGE = `Save up to ${getYearlySavingsPercent("pro")}%`;

export const HOMEPAGE_PRICING_LINK_LABEL = "Compare plans in detail";

export const PRICING_PAGE_TITLE = "Pick the plan that fits your household.";
export const PRICING_PAGE_SUBTITLE = "Use the public free payslip tool, or pay now for Standard or Pro dashboard access.";
export const PRICING_PAGE_NUDGE_TITLE = "Standard to Pro is less than R13/month extra.";
export const PRICING_PAGE_NUDGE_BODY = "That's the price of a cup of coffee for full document storage, year-end summaries, and 5 years of searchable history.";
export const PLANNED_FEATURES_TITLE = "Planned features";

export const MARKETING_PLAN_DISPLAY: Record<PlanId, MarketingPlanDisplay> = {
    free: {
        label: "Free",
        headline: "Start simple.",
        subtitle: "One worker. Basic monthly payslips. No sign-up needed.",
        liveFeatures: [
            "1 payslip per month as PDF",
            "Enter details, generate, download",
            "Household checklist and guides",
        ],
        ctaLabel: "Start free",
        ctaSubtext: "Public payslip tool. No billing. No account.",
    },
    standard: {
        label: "Standard",
        headline: "For most households.",
        subtitle: "Payslips, leave, contracts, organised records, and automatic private backup.",
        badge: "Early-bird pricing",
        badgeTone: "earlybird",
        launchNote: "Launch pricing for early customers.",
        featureIntro: "Everything in Free, plus:",
        liveFeatures: [
            "Up to 3 active employees",
            "Leave tracking — annual, sick & family responsibility",
            "Employment contract drafts",
            "Upload signed contract copies",
            "Documents hub for payslips and contracts",
            "uFiling CSV export and ROE downloads",
            "Cloud-secured storage",
            "12 months of history",
        ],
        ctaLabel: "Choose Standard",
    },
    pro: {
        label: "Pro",
        headline: "For long-term records and more control.",
        subtitle: "Advanced document tools, full storage, longer history, and support for more complexity.",
        badge: "Early-bird pricing",
        badgeTone: "earlybird",
        launchNote: "Launch pricing for early customers.",
        featureIntro: "Everything in Standard, plus:",
        liveFeatures: [
            "Unlimited employees",
            "Document vault for any employment files",
            "Year-end employment summary PDF",
            "5 years of searchable history",
            "Multiple households",
            "Faster support",
        ],
        plannedFeaturesTitle: PLANNED_FEATURES_TITLE,
        plannedFeatures: [
            "Android app access when available",
            "Notification reminders",
            "Advanced employment records",
        ],
        ctaLabel: "Choose Pro",
    },
};

export interface MarketingPlanFeatureSection {
    kind: "live" | "planned";
    title?: string;
    items: string[];
}

export function getMarketingPlanDisplay(planId: PlanId): MarketingPlanDisplay {
    return MARKETING_PLAN_DISPLAY[planId];
}

export function getMarketingPlanFeatureSections(planId: PlanId): MarketingPlanFeatureSection[] {
    const plan = getMarketingPlanDisplay(planId);
    const sections: MarketingPlanFeatureSection[] = [];

    if (plan.liveFeatures.length > 0) {
        sections.push({
            kind: "live",
            title: plan.featureIntro,
            items: plan.liveFeatures,
        });
    }

    if ((plan.plannedFeatures?.length ?? 0) > 0) {
        sections.push({
            kind: "planned",
            title: plan.plannedFeaturesTitle ?? PLANNED_FEATURES_TITLE,
            items: plan.plannedFeatures ?? [],
        });
    }

    return sections;
}

export function createPlannedComparisonValue(label = "Planned"): PlannedComparisonValue {
    return {
        kind: "planned",
        label,
    };
}

export function isPlannedComparisonValue(value: PricingComparisonValue): value is PlannedComparisonValue {
    return typeof value === "object" && value !== null && value.kind === "planned";
}

export const PRICING_COMPARISON_GROUPS: PricingComparisonGroup[] = [
    {
        title: "Coverage",
        rows: [
            { label: "Active employees", values: { free: "1", standard: "Up to 3", pro: "Unlimited" } },
            { label: "Households", values: { free: "1", standard: "1", pro: "Multiple" } },
            { label: "Searchable history", values: { free: "3 months", standard: "12 months", pro: "5 years" } },
        ],
    },
    {
        title: "Payroll",
        rows: [
            { label: "Monthly payslip PDFs", values: { free: true, standard: true, pro: true } },
            { label: "Leave tracking", values: { free: false, standard: true, pro: true } },
            { label: "uFiling CSV export", values: { free: false, standard: true, pro: true } },
            { label: "ROE downloads", values: { free: false, standard: true, pro: true } },
            { label: "Year-end employment summary PDF", values: { free: false, standard: false, pro: true } },
        ],
    },
    {
        title: "Documents",
        rows: [
            { label: "Contract drafts", values: { free: false, standard: true, pro: true } },
            { label: "Upload signed contract copies", values: { free: false, standard: true, pro: true } },
            { label: "Documents hub (payslips & contracts)", values: { free: false, standard: true, pro: true } },
            { label: "Document vault (upload any file)", values: { free: false, standard: false, pro: true } },
        ],
    },
    {
        title: "Storage & backup",
        rows: [
            { label: "Cloud-secured storage", values: { free: false, standard: true, pro: true } },
            { label: "Access from any device", values: { free: false, standard: true, pro: true } },
        ],
    },
    {
        title: PLANNED_FEATURES_TITLE,
        rows: [
            { label: "Android app access when available", values: { free: false, standard: false, pro: createPlannedComparisonValue() } },
            { label: "Notification reminders", values: { free: false, standard: false, pro: createPlannedComparisonValue() } },
            { label: "Advanced employment records", values: { free: false, standard: false, pro: createPlannedComparisonValue() } },
        ],
    },
    {
        title: "Support",
        rows: [
            {
                label: "Email support",
                values: {
                    free: "1–4 business days",
                    standard: "1–4 business days",
                    pro: "1 business day",
                },
            },
        ],
    },
];

export function getMarketingPlanHref(planId: PlanId, billingCycle: BillingCycle): string {
    if (planId === "free") {
        return "/resources/tools/domestic-worker-payslip";
    }

    return `/upgrade?plan=${planId}&billing=${billingCycle}&pay=1`;
}

export function getMarketingPlanCtaSubtext(planId: PlanId, billingCycle: BillingCycle): string | null {
    const plan = getMarketingPlanDisplay(planId);
    if (planId === "free") {
        return plan.ctaSubtext ?? null;
    }

    const chargeToday = PLANS[planId].pricing[billingCycle];
    return chargeToday ? `Pay R${chargeToday} now, then ${billingCycle}` : null;
}

export function getMarketingPriceDisplay(planId: PlanId, billingCycle: BillingCycle): PriceDisplay {
    if (planId === "free") {
        return {
            primary: "Free",
            periodLabel: "",
            helperText: "Public payslip tool. No billing. No account.",
        };
    }

    const monthly = PLANS[planId].pricing.monthly;
    const yearly = PLANS[planId].pricing.yearly;

    if (!monthly || !yearly) {
        return {
            primary: "Free",
            periodLabel: "",
            helperText: "Public payslip tool. No billing. No account.",
        };
    }

    const yearlyEquivalent = (yearly / 12).toFixed(2);

    if (billingCycle === "yearly") {
        return {
            primary: `R${yearly}`,
            periodLabel: "/year",
            helperText: `≈ R${yearlyEquivalent}/month`,
        };
    }

    return {
        primary: `R${monthly}`,
        periodLabel: "/month",
        helperText: `Or R${yearly}/year — works out to R${yearlyEquivalent}/month`,
    };
}
