import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
    usePathname: () => "/resources",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("@/components/auth/auth-state-provider", () => ({
    useAuthState: () => ({
        user: null,
        signOut: vi.fn(),
    }),
}));

vi.mock("@/components/ui/logo", () => ({
    Logo: () => <div data-testid="logo" />,
}));

vi.mock("@/components/ui/button", () => ({
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button {...props}>{children}</button>
    ),
}));

vi.mock("@/components/seo/compliance-disclaimer", () => ({
    ComplianceDisclaimer: () => <div data-testid="compliance-disclaimer" />,
}));

vi.mock("@/components/seo/json-ld", () => ({
    JsonLd: () => null,
    breadcrumbSchema: () => ({}),
}));

import ResourcesHub from "./resources/page";
import SupportPage from "./support/page";
import UFilingErrorsPage from "./ufiling-errors/page";

describe("public audit fixes", () => {
    it("routes the resources CTA to the free payslip tool", () => {
        render(<ResourcesHub />);

        expect(screen.getByRole("link", { name: "Try the free payslip tool" })).toHaveAttribute(
            "href",
            "/resources/tools/domestic-worker-payslip",
        );
    });

    it("keeps the uFiling marketing page aligned with Standard and Pro export access", () => {
        render(<UFilingErrorsPage />);

        expect(screen.getByText("The uFiling CSV export is available on Standard and Pro paid plans. Compare the paid tiers to choose the one that matches your household.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "See plans with uFiling CSV export" })).toHaveAttribute("href", "/pricing");
        expect(screen.queryByText(/Pro users/i)).not.toBeInTheDocument();
    });

    it("removes the stale popup and browser troubleshooting guidance", () => {
        render(<SupportPage />);

        expect(screen.queryByText(/third-party cookies or pop-ups/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Chrome or Edge/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Incognito or Private Browsing/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/Refresh the page and sign in again/i).length).toBeGreaterThan(0);
    });
});
