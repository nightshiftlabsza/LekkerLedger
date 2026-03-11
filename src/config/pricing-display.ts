import { type BillingCycle, type PlanId } from "./plans";

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
    features: string[];
    ctaLabel: string;
    ctaSubtext: string;
    /** Per-billing-cycle subtext shown only on upgrade CTAs (overrides ctaSubtext). */
    ctaSubtextByCycle?: Record<BillingCycle, string>;
    prices: Record<BillingCycle, PriceDisplay>;
}

export interface PricingComparisonRow {
    label: string;
    values: Record<PlanId, boolean | string>;
}

export interface PricingComparisonGroup {
    title: string;
    rows: PricingComparisonRow[];
}

export const MARKETING_BILLING_CYCLE_STORAGE_KEY = "lekkerledger:marketing-billing-cycle";
export const MARKETING_YEARLY_BADGE = "Save up to 32%";

export const HOMEPAGE_PRICING_LINK_LABEL = "Compare plans in detail";

export const PRICING_PAGE_TITLE = "Pick the plan that fits your household.";
export const PRICING_PAGE_SUBTITLE = "Start free. Or pay R1 for your first 14 days on Standard or Pro.";
export const PRICING_PAGE_NUDGE_TITLE = "Standard to Pro is less than R13/month extra.";
export const PRICING_PAGE_NUDGE_BODY = "That's the price of a cup of coffee for full document storage, year-end summaries, and 5 years of searchable history.";

export const MARKETING_PLAN_DISPLAY: Record<PlanId, MarketingPlanDisplay> = {
    free: {
        label: "Free",
        headline: "Start simple.",
        subtitle: "One worker. Basic monthly payslips. No sign-up needed.",
        features: [
            "1 active employee",
            "Monthly payslips — preview, download, share",
            "Household checklist and guides",
            "Stored on this device",
        ],
        ctaLabel: "Start free",
        ctaSubtext: "No billing. No account required.",
        prices: {
            monthly: {
                primary: "Free",
                periodLabel: "",
                helperText: "No billing. No account required.",
            },
            yearly: {
                primary: "Free",
                periodLabel: "",
                helperText: "No billing. No account required.",
            },
        },
    },
    standard: {
        label: "Standard",
        headline: "For most households.",
        subtitle: "Payslips, leave, contracts, organised records, and automatic private backup.",
        badge: "Early-bird pricing",
        badgeTone: "earlybird",
        launchNote: "Launch pricing for early customers.",
        featureIntro: "Everything in Free, plus:",
        features: [
            "Up to 3 active employees",
            "Leave tracking — annual, sick & family responsibility",
            "Employment contract drafts",
            "Upload signed contract copies",
            "Documents hub for payslips and contracts",
            "uFiling CSV export and ROE downloads",
            "Encrypted sync",
            "12 months of history",
        ],
        ctaLabel: "Try Standard for R1",
        ctaSubtext: "14-day trial, then R29/month",
        ctaSubtextByCycle: {
            monthly: "14-day trial, then R29/month",
            yearly: "14-day trial, then R249/year",
        },
        prices: {
            monthly: {
                primary: "R29",
                periodLabel: "/month",
                helperText: "Or R249/year — works out to R20.75/month",
            },
            yearly: {
                primary: "R249",
                periodLabel: "/year",
                helperText: "≈ R20.75/month",
            },
        },
    },
    pro: {
        label: "Pro",
        headline: "For long-term records and more control.",
        subtitle: "Advanced document tools, full storage, longer history, and support for more complexity.",
        badge: "Early-bird pricing",
        badgeTone: "earlybird",
        launchNote: "Launch pricing for early customers.",
        featureIntro: "Everything in Standard, plus:",
        features: [
            "Unlimited employees",
            "Document vault for any employment files",
            "Advanced employment records — Planned",
            "Year-end employment summary PDF",
            "5 years of searchable history",
            "Multiple households",
            "Faster support",
            "Priority access to the Android app when available",
        ],
        ctaLabel: "Try Pro for R1",
        ctaSubtext: "14-day trial, then R49/month",
        ctaSubtextByCycle: {
            monthly: "14-day trial, then R49/month",
            yearly: "14-day trial, then R399/year",
        },
        prices: {
            monthly: {
                primary: "R49",
                periodLabel: "/month",
                helperText: "Or R399/year — works out to R33.25/month",
            },
            yearly: {
                primary: "R399",
                periodLabel: "/year",
                helperText: "≈ R33.25/month",
            },
        },
    },
};

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
            { label: "Advanced employment records", values: { free: false, standard: false, pro: "Planned" } },
        ],
    },
    {
        title: "Storage & backup",
        rows: [
            { label: "Stored on device", values: { free: true, standard: true, pro: true } },
            { label: "Encrypted sync", values: { free: false, standard: true, pro: true } },
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
        return "/dashboard";
    }

    return `/upgrade?plan=${planId}&billing=${billingCycle}&pay=1`;
}

export function getMarketingPriceDisplay(planId: PlanId, billingCycle: BillingCycle): PriceDisplay {
    return MARKETING_PLAN_DISPLAY[planId].prices[billingCycle];
}
