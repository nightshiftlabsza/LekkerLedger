import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    pushMock: vi.fn(),
    signInWithPasswordMock: vi.fn(),
    fetchVerifiedEntitlementsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.pushMock,
    }),
    useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: (...args: unknown[]) => mocks.signInWithPasswordMock(...args),
        },
    }),
}));

vi.mock("@/lib/billing-client", () => ({
    fetchVerifiedEntitlements: (...args: unknown[]) => mocks.fetchVerifiedEntitlementsMock(...args),
}));

vi.mock("@/lib/billing-handoff", () => ({
    readPendingBillingReference: () => "",
}));

vi.mock("@/lib/paid-activation", () => ({
    buildPaidDashboardHref: ({ reference }: { reference?: string | null }) => reference ? `/dashboard?paidLogin=1&reference=${reference}` : "/dashboard",
}));

import { LoginForm } from "./login-form";

describe("LoginForm paid access enforcement", () => {
    beforeEach(() => {
        mocks.pushMock.mockReset();
        mocks.signInWithPasswordMock.mockReset();
        mocks.fetchVerifiedEntitlementsMock.mockReset();
    });

    it("redirects unpaid users to pricing after successful sign-in", async () => {
        mocks.signInWithPasswordMock.mockResolvedValue({ error: null });
        mocks.fetchVerifiedEntitlementsMock.mockResolvedValue({
            planId: "free",
            billingCycle: "monthly",
            status: "free",
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            isActive: false,
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mocks.pushMock).toHaveBeenCalledWith("/pricing");
        });
    });

    it("continues paid users into the dashboard", async () => {
        mocks.signInWithPasswordMock.mockResolvedValue({ error: null });
        mocks.fetchVerifiedEntitlementsMock.mockResolvedValue({
            planId: "standard",
            billingCycle: "monthly",
            status: "active",
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            isActive: true,
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard");
        });
    });
});
