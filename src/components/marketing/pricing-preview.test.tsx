import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PricingPreview } from "./pricing-preview";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("@/components/billing/inline-paid-plan-checkout", () => ({
    useInlinePaidPlanCheckout: () => ({
        startCheckout: vi.fn(),
        loadingPlanId: null,
        dialog: null,
        warmCheckout: vi.fn(),
    }),
}));

vi.mock("@/components/marketing/pricing", () => ({
    MarketingBillingToggle: () => <div data-testid="billing-toggle" />,
    MarketingPlanCards: () => <div data-testid="marketing-plan-cards" />,
}));

vi.mock("@/src/lib/use-marketing-billing-cycle", () => ({
    useMarketingBillingCycle: () => ["monthly", vi.fn()] as const,
}));

describe("PricingPreview", () => {
    it("keeps the shared preview headline and subtitle unchanged", () => {
        render(<PricingPreview />);

        expect(
            screen.getByRole("heading", { level: 2, name: "Pick the plan that fits your household." }),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Use the public free payslip tool, or pay now for Standard or Pro dashboard access."),
        ).toBeInTheDocument();
    });
});
