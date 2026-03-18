import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    replaceMock: vi.fn(),
    resolvePaidActivationMock: vi.fn(),
    createPaidActivationAccountMock: vi.fn(),
    signInWithPasswordMock: vi.fn(),
    getUserMock: vi.fn(),
    storeCredentialHandoffMock: vi.fn(),
    pendingReference: "",
    pendingEmail: "",
    pendingCheckoutState: null as null | {
        planId: "standard" | "pro";
        billingCycle: "monthly" | "yearly";
        email: string;
        referralCode?: string | null;
        reference?: string | null;
    },
    writePendingReference: vi.fn(),
    writePendingEmail: vi.fn(),
    writePendingCheckoutState: vi.fn(),
    clearPendingBillingHandoffMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mocks.replaceMock,
    }),
    useSearchParams: () => new URLSearchParams("reference=ref_123"),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("@/lib/billing-client", () => ({
    resolvePaidActivation: (...args: unknown[]) => mocks.resolvePaidActivationMock(...args),
    createPaidActivationAccount: (...args: unknown[]) => mocks.createPaidActivationAccountMock(...args),
}));

vi.mock("@/lib/billing-handoff", () => ({
    readPendingBillingReference: () => mocks.pendingReference,
    readPendingBillingCheckoutState: () => mocks.pendingCheckoutState,
    writePendingBillingReference: (reference: string) => {
        mocks.pendingReference = reference;
        mocks.writePendingReference(reference);
    },
    writePendingBillingEmail: (email: string) => {
        mocks.pendingEmail = email;
        mocks.writePendingEmail(email);
    },
    writePendingBillingCheckoutState: (state: unknown) => {
        mocks.pendingCheckoutState = state as typeof mocks.pendingCheckoutState;
        mocks.writePendingCheckoutState(state);
    },
    clearPendingBillingHandoff: () => mocks.clearPendingBillingHandoffMock(),
}));

vi.mock("@/lib/credential-handoff", () => ({
    storeCredentialHandoff: (...args: unknown[]) => mocks.storeCredentialHandoffMock(...args),
}));

vi.mock("@/lib/paid-activation", () => ({
    buildPaidDashboardHref: ({ reference }: { reference?: string | null }) => reference ? `/dashboard?paidLogin=1&reference=${reference}` : "/dashboard",
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: (...args: unknown[]) => mocks.signInWithPasswordMock(...args),
            getUser: (...args: unknown[]) => mocks.getUserMock(...args),
        },
    }),
}));

vi.mock("@/components/auth/login-form", () => ({
    LoginForm: ({ initialEmail, lockEmail }: { initialEmail?: string; lockEmail?: boolean }) => (
        <div data-testid="login-form">
            {initialEmail}|{String(lockEmail)}
        </div>
    ),
}));

import BillingActivatePage from "./page";

describe("BillingActivatePage", () => {
    beforeEach(() => {
        mocks.replaceMock.mockReset();
        mocks.resolvePaidActivationMock.mockReset();
        mocks.createPaidActivationAccountMock.mockReset();
        mocks.signInWithPasswordMock.mockReset();
        mocks.getUserMock.mockReset();
        mocks.storeCredentialHandoffMock.mockReset();
        mocks.writePendingReference.mockReset();
        mocks.writePendingEmail.mockReset();
        mocks.writePendingCheckoutState.mockReset();
        mocks.clearPendingBillingHandoffMock.mockReset();
        mocks.pendingReference = "";
        mocks.pendingEmail = "";
        mocks.pendingCheckoutState = {
            planId: "pro",
            billingCycle: "monthly",
            email: "stored@example.com",
            referralCode: "REF123",
            reference: "ref_123",
        };
        mocks.getUserMock.mockResolvedValue({ data: { user: null } });
    });

    it("renders direct account creation for verified new paid users", async () => {
        mocks.resolvePaidActivationMock.mockResolvedValue({
            status: "payment_verified_new_user",
            reference: "ref_123",
            email: "new@example.com",
            planId: "pro",
            billingCycle: "monthly",
        });
        mocks.createPaidActivationAccountMock.mockResolvedValue({
            status: "payment_verified_existing_continue_setup",
            reference: "ref_123",
            email: "new@example.com",
            planId: "pro",
            billingCycle: "monthly",
        });
        mocks.signInWithPasswordMock.mockResolvedValue({ error: null });

        render(<BillingActivatePage />);

        await screen.findByText("Payment confirmed. Create your password.");
        fireEvent.change(screen.getByLabelText("Create a password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Create paid account" }));

        await waitFor(() => {
            expect(mocks.createPaidActivationAccountMock).toHaveBeenCalledWith({
                reference: "ref_123",
                password: "Password123!",
            });
        });

        await waitFor(() => {
            expect(mocks.signInWithPasswordMock).toHaveBeenCalledWith({
                email: "new@example.com",
                password: "Password123!",
            });
        });

        expect(mocks.storeCredentialHandoffMock).toHaveBeenCalledWith("new@example.com", "Password123!");
        expect(mocks.replaceMock).toHaveBeenCalledWith("/dashboard?paidLogin=1&reference=ref_123");
    });

    it("renders locked-email login continuation for existing accounts", async () => {
        mocks.resolvePaidActivationMock.mockResolvedValue({
            status: "payment_verified_existing_login",
            reference: "ref_123",
            email: "existing@example.com",
            planId: "standard",
            billingCycle: "yearly",
        });

        render(<BillingActivatePage />);

        await screen.findByText("Payment confirmed. Log in to continue.");
        expect(screen.getByTestId("login-form").textContent).toBe("existing@example.com|true");
    });

    it("shows retry checkout for failed or unpaid payments", async () => {
        mocks.resolvePaidActivationMock.mockResolvedValue({
            status: "payment_failed_or_unpaid",
            reference: "ref_123",
            email: "failed@example.com",
            planId: "pro",
            billingCycle: "monthly",
        });

        render(<BillingActivatePage />);

        await screen.findByText("Payment could not be verified");
        const retryLink = screen.getByRole("link", { name: /retry checkout/i });
        expect(retryLink.getAttribute("href")).toBe("/billing/checkout?plan=pro&cycle=monthly&ref=REF123");
    });
});
