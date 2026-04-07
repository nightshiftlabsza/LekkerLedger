import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PricingPage from "./page";

const mocks = vi.hoisted(() => ({
    marketingPlanCardsMock: vi.fn(() => <div data-testid="marketing-plan-cards" />),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("@/components/layout/marketing-header", () => ({
    MarketingHeader: () => <div data-testid="marketing-header" />,
}));

vi.mock("@/components/marketing/pricing", () => ({
    MarketingBillingToggle: () => <div data-testid="billing-toggle" />,
    MarketingPlanCards: (props: unknown) => mocks.marketingPlanCardsMock(props),
    PricingComparisonTable: () => <div data-testid="pricing-comparison-table" />,
}));

vi.mock("@/components/billing/inline-paid-plan-checkout", () => ({
    useInlinePaidPlanCheckout: () => ({
        startCheckout: vi.fn(),
        loadingPlanId: null,
        dialog: <div data-testid="checkout-dialog" />,
        warmCheckout: vi.fn(),
    }),
}));

vi.mock("@/src/lib/use-marketing-billing-cycle", () => ({
    useMarketingBillingCycle: () => ["monthly", vi.fn()] as const,
}));

describe("PricingPage", () => {
    it("renders the pricing-page-specific hero and chooser copy", () => {
        render(<PricingPage />);

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "Pricing for domestic worker payslips, UIF, and payroll records",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Start free with one payslip a month, or choose a paid plan for leave, contracts, records, and uFiling-ready admin."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Choose Pro only if you need more storage, more history, or multiple households"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Standard will fit most single-household setups. Pro is for longer history, more files, and more complex record-keeping."),
        ).toBeInTheDocument();
    });

    it("passes pricing-page-only plan copy overrides to the shared plan cards", () => {
        render(<PricingPage />);

        expect(mocks.marketingPlanCardsMock).toHaveBeenCalled();

        const firstCall = mocks.marketingPlanCardsMock.mock.calls.at(-1)?.[0] as {
            planDisplayOverrides?: Record<string, Record<string, string | undefined>>;
        };

        expect(firstCall.planDisplayOverrides?.free).toMatchObject({
            headline: "One free payslip each month",
            subtitle: "Best if you only need an occasional domestic worker payslip PDF",
        });
        expect(firstCall.planDisplayOverrides?.standard).toMatchObject({
            headline: "Best for one household with regular monthly admin",
            subtitle: "Payslips, leave tracking, contracts, UIF-ready exports, and 12 months of records for up to 3 workers",
            badge: "Launch pricing",
            launchNote: undefined,
        });
        expect(firstCall.planDisplayOverrides?.pro).toMatchObject({
            headline: "Best for multiple households, longer history, and more files",
            subtitle: "Adds file vault, year-end summaries, 5 years of history, and support for more complex record-keeping",
            badge: "Launch pricing",
            launchNote: undefined,
        });
    });
});
