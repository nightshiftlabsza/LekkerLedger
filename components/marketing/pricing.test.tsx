import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getMarketingPlanDisplay } from "@/src/config/pricing-display";
import { MarketingPlanCard, PlanFeatureList } from "./pricing";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

describe("PlanFeatureList", () => {
    it("shows a separate planned-features section for pro", () => {
        const { container } = render(<PlanFeatureList planId="pro" />);

        expect(screen.getByText("Planned features")).toBeTruthy();
        expect(screen.getByText("Android app access when available")).toBeTruthy();
        expect(
            container.querySelector('[data-feature-section="planned"] [data-feature-kind="planned"]'),
        ).toBeTruthy();
    });

    it("does not render a planned-features section for standard", () => {
        const { container } = render(<PlanFeatureList planId="standard" />);

        expect(screen.queryByText("Planned features")).toBeNull();
        expect(container.querySelector('[data-feature-section="planned"]')).toBeNull();
    });

    it("applies page-level copy overrides without mutating the shared pricing config", () => {
        render(
            <MarketingPlanCard
                planId="standard"
                billingCycle="monthly"
                onSelect={() => undefined}
                planDisplayOverrides={{
                    standard: {
                        headline: "Best for one household with regular monthly admin",
                        subtitle: "Payslips, leave tracking, contracts, UIF-ready exports, and 12 months of records for up to 3 workers",
                        badge: "Launch pricing",
                        launchNote: undefined,
                    },
                }}
            />,
        );

        expect(screen.getByRole("heading", { level: 2, name: "Best for one household with regular monthly admin" })).toBeInTheDocument();
        expect(
            screen.getByText("Payslips, leave tracking, contracts, UIF-ready exports, and 12 months of records for up to 3 workers"),
        ).toBeInTheDocument();
        expect(screen.getByText("Launch pricing")).toBeInTheDocument();
        expect(screen.queryByText("Launch pricing for early customers.")).toBeNull();
        expect(getMarketingPlanDisplay("standard").headline).toBe("For most households.");
    });
});
