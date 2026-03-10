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
    badgeTone?: "primary" | "subtle";
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
export const PRICING_PAGE_SUBTITLE = "Start free with basic payslips, or pay R1 for your first 14 days on Standard or Pro.";
export const PRICING_PAGE_NUDGE_TITLE = "Standard to Pro is less than R13/month extra.";
export const PRICING_PAGE_NUDGE_BODY = "That's the price of a cup of coffee for full document storage, year-end summaries, and 5 years of searchable history.";

export const MARKETING_PLAN_DISPLAY: Record<PlanId, MarketingPlanDisplay> = {
    free: {
        label: "FREE",
        headline: "Try it out, or keep it simple.",
        subtitle: "One worker. Quick monthly payslips. No sign-up needed.",
        features: [
            "1 active employee",
            "Monthly payslips — preview, download, share",
            "Household checklist and guides",
            "Stored on this device",
        ],
        ctaLabel: "Start free",
        ctaSubtext: "Upgrade anytime",
        prices: {
            monthly: {
                primary: "Free",
                periodLabel: "",
                helperText: "No billing, no account required",
            },
            yearly: {
                primary: "Free",
                periodLabel: "",
                helperText: "No billing, no account required",
            },
        },
    },
    standard: {
        label: "STANDARD",
        headline: "Do it properly.",
        subtitle: "A domestic worker, nanny, and gardener — up to 3 workers with organised records and backup.",
        badge: "Most popular",
        badgeTone: "primary",
        featureIntro: "Everything in Free, plus:",
        features: [
            "Up to 3 active employees",
            "Leave tracking — annual, sick & family responsibility",
            "Employment contract drafts",
            "Upload signed copies of your contracts",
            "Documents hub for payslips and contracts",
            "uFiling CSV export and ROE downloads",
            "Google Drive backup",
            "12 months of browsable history",
        ],
        ctaLabel: "14 days for R1",
        ctaSubtext: "then R29/month",
        ctaSubtextByCycle: {
            monthly: "then R29/month",
            yearly: "then R249/year",
        },
        prices: {
            monthly: {
                primary: "R29",
                periodLabel: "/month",
                helperText: "R1 today, then R29/month",
            },
            yearly: {
                primary: "R20.75",
                periodLabel: "/month",
                helperText: "R1 today, then R249/year",
            },
        },
    },
    pro: {
        label: "PRO",
        headline: "Complete peace of mind.",
        subtitle: "Full document storage, year-end summaries, long-term history, and faster support. Also for multiple households.",
        badge: "Full control",
        badgeTone: "subtle",
        featureIntro: "Everything in Standard, plus:",
        features: [
            "Unlimited employees",
            "Document vault — upload and store signed contracts, ID copies, anything",
            "Year-end employment summary PDF",
            "5 years of browsable, searchable history",
            "Automatic scheduled backups",
            "Faster support — reply within 1 business day",
            "Multiple households (main home + holiday home)",
        ],
        ctaLabel: "14 days for R1",
        ctaSubtext: "then R49/month",
        ctaSubtextByCycle: {
            monthly: "then R49/month",
            yearly: "then R399/year",
        },
        prices: {
            monthly: {
                primary: "R49",
                periodLabel: "/month",
                helperText: "R1 today, then R49/month",
            },
            yearly: {
                primary: "R33.25",
                periodLabel: "/month",
                helperText: "R1 today, then R399/year",
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
            { label: "Browsable history", values: { free: "3 months", standard: "12 months", pro: "5 years" } },
        ],
    },
    {
        title: "Payroll",
        rows: [
            { label: "Monthly payslip PDFs", values: { free: true, standard: true, pro: true } },
            { label: "Leave tracking", values: { free: false, standard: true, pro: true } },
            { label: "uFiling CSV export", values: { free: false, standard: true, pro: true } },
            { label: "ROE downloads", values: { free: false, standard: true, pro: true } },
            { label: "Year-end employment summary", values: { free: false, standard: false, pro: true } },
        ],
    },
    {
        title: "Documents",
        rows: [
            { label: "Contract drafts", values: { free: false, standard: true, pro: true } },
            { label: "Upload signed contract copies", values: { free: false, standard: true, pro: true } },
            { label: "Documents hub", values: { free: false, standard: true, pro: true } },
            { label: "Document vault (upload any file)", values: { free: false, standard: false, pro: true } },
            { label: "Bulk export of all records", values: { free: false, standard: false, pro: true } },
        ],
    },
    {
        title: "Storage & backup",
        rows: [
            { label: "Stored on device", values: { free: true, standard: true, pro: true } },
            { label: "Google Drive backup (manual)", values: { free: false, standard: true, pro: true } },
            { label: "Automatic scheduled backups", values: { free: false, standard: false, pro: true } },
        ],
    },
    {
        title: "Support",
        rows: [
            {
                label: "Email support",
                values: {
                    free: "1-4 business days (Mon-Fri, SAST)",
                    standard: "1-4 business days (Mon-Fri, SAST)",
                    pro: "1 business day (Mon-Fri, SAST)",
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
