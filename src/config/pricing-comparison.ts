import { PLAN_ORDER, PLANS, type PlanId } from "./plans";

type PlanValue = boolean | string;

interface PricingComparisonRow {
    label: string;
    values: {
        free: PlanValue;
        standard: PlanValue;
        pro: PlanValue;
    };
}

interface PricingComparisonGroup {
    title: string;
    rows: PricingComparisonRow[];
}

function mapPlanValues(getValue: (planId: PlanId) => PlanValue): Record<PlanId, PlanValue> {
    return PLAN_ORDER.reduce((values, planId) => {
        values[planId] = getValue(planId);
        return values;
    }, {} as Record<PlanId, PlanValue>);
}

export const PRICING_COMPARISON_GROUPS: PricingComparisonGroup[] = [
    {
        title: "Coverage",
        rows: [
            { label: "Active employees", values: { free: "1", standard: "Up to 3", pro: "Unlimited" } },
            { label: "Households", values: { free: "1", standard: "1", pro: "Multiple" } },
            { label: "Archive access", values: { free: "3 months", standard: "12 months", pro: "5 years" } },
        ],
    },
    {
        title: "Core payroll",
        rows: [
            { label: "Monthly payroll workflow", values: { free: true, standard: true, pro: true } },
            { label: "Leave tracking", values: { free: false, standard: true, pro: true } },
            { label: "Advanced leave forecasting and carry-over", values: { free: false, standard: false, pro: true } },
        ],
    },
    {
        title: "Records and paperwork",
        rows: [
            { label: "Contract drafts", values: { free: false, standard: true, pro: true } },
            {
                label: "Upload signed contract copies",
                values: mapPlanValues((planId) => PLANS[planId].features.contractSignedCopyUpload),
            },
            { label: "Documents hub", values: { free: true, standard: true, pro: true } },
            { label: "Vault uploads", values: { free: false, standard: false, pro: true } },
            { label: "Year-end summary PDF", values: { free: false, standard: false, pro: true } },
            { label: "uFiling export and ROE downloads", values: { free: false, standard: true, pro: true } },
        ],
    },
    {
        title: "Storage and backup",
        rows: [
            { label: "Stored on this device", values: { free: true, standard: true, pro: true } },
            { label: "Google Drive backup in your account", values: { free: false, standard: true, pro: true } },
            { label: "Automatic backup", values: { free: false, standard: false, pro: true } },
            { label: "Restore on another device", values: { free: false, standard: true, pro: true } },
        ],
    },
    {
        title: "Household control",
        rows: [
            { label: "Custom leave types", values: { free: false, standard: false, pro: true } },
            { label: "Multiple household separation", values: { free: false, standard: false, pro: true } },
            { label: "Priority headroom for larger records", values: { free: false, standard: false, pro: true } },
        ],
    },
];
