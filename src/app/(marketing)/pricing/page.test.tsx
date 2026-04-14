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
            screen.getByText("Get your first payslip free, or pay now for Standard or Pro dashboard access."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Choose Pro only if you need more storage, more history, or multiple households"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Standard is the ongoing monthly option for household employers who want leave tracking, records, and UIF-ready admin. Pro adds full document storage, year-end summaries, and 5 years of searchable history."),
        ).toBeInTheDocument();
    });

    it("passes pricing-page-only plan copy overrides to the shared plan cards", () => {
        render(<PricingPage />);

        expect(mocks.marketingPlanCardsMock).toHaveBeenCalled();

        const firstCall = mocks.marketingPlanCardsMock.mock.calls.at(-1)?.[0] as {
            planDisplayOverrides?: Record<string, Record<string, string | undefined>>;
        };

        expect(firstCall.planDisplayOverrides?.free).toMatchObject({
            headline: "Get your first payslip free",
            subtitle: "No account needed for your first sample. We’ll email the PDF to you.",
        });
        expect(firstCall.planDisplayOverrides?.standard).toMatchObject({
            headline: "For monthly household payroll.",
            subtitle: "Payslips, leave, contracts, organised records, and automatic private backup for a household employer who needs payroll done properly.",
            badge: "Launch pricing",
            launchNote: undefined,
        });
        expect(firstCall.planDisplayOverrides?.pro).toMatchObject({
            headline: "For long-term records and more control.",
            subtitle: "Advanced document tools, full storage, longer history, and support for more complexity.",
            badge: "Launch pricing",
            launchNote: undefined,
        });
    });
});
