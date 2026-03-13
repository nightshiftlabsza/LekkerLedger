import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    let pendingReference = "";
    let pendingEmail = "";

    return {
        pushMock: vi.fn(),
        replaceMock: vi.fn(),
        refreshMock: vi.fn(),
        confirmBillingTransactionMock: vi.fn(),
        confirmGuestBillingTransactionMock: vi.fn(),
        fetchBillingAccountMock: vi.fn(),
        clearBillingErrorMock: vi.fn(),
        resetHandoff() {
            pendingReference = "";
            pendingEmail = "";
        },
        readPendingReference() {
            return pendingReference;
        },
        writePendingReference(reference: string) {
            pendingReference = reference;
        },
        readPendingEmail() {
            return pendingEmail;
        },
        writePendingEmail(email: string) {
            pendingEmail = email;
        },
        clearPendingBillingHandoff() {
            pendingReference = "";
            pendingEmail = "";
        },
    };
});

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.pushMock,
        replace: mocks.replaceMock,
        refresh: mocks.refreshMock,
    }),
    usePathname: () => "/billing/success",
    useSearchParams: () => new URLSearchParams("reference=ref_123"),
}));

vi.mock("@/lib/billing-client", () => ({
    clearBillingError: (...args: unknown[]) => mocks.clearBillingErrorMock(...args),
    confirmBillingTransaction: (...args: unknown[]) => mocks.confirmBillingTransactionMock(...args),
    confirmGuestBillingTransaction: (...args: unknown[]) => mocks.confirmGuestBillingTransactionMock(...args),
    fetchBillingAccount: (...args: unknown[]) => mocks.fetchBillingAccountMock(...args),
}));

vi.mock("@/components/auth/signup-form", () => ({
    SignUpForm: ({ initialEmail }: { initialEmail: string }) => (
        <div data-testid="signup-form">Sign up for {initialEmail}</div>
    ),
}));

vi.mock("@/lib/billing-handoff", () => ({
    clearPendingBillingHandoff: () => mocks.clearPendingBillingHandoff(),
    readPendingBillingEmail: () => mocks.readPendingEmail(),
    readPendingBillingReference: () => mocks.readPendingReference(),
    writePendingBillingEmail: (email: string) => mocks.writePendingEmail(email),
    writePendingBillingReference: (reference: string) => mocks.writePendingReference(reference),
}));

import BillingSuccessPage from "./page";

function createBillingAccount(status: "active" | "trialing" = "active") {
    return {
        entitlements: {
            planId: "pro",
            billingCycle: "yearly",
            status,
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            isActive: status === "active",
        },
        account: {
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            successfulReferralCount: 0,
            totalReferralMonthsEarned: 0,
            nextChargeAt: "2027-03-10T21:08:55.000Z",
            trialEndsAt: status === "trialing" ? "2026-03-24T12:00:00.000Z" : undefined,
        },
    };
}

describe("BillingSuccessPage", () => {
    beforeEach(() => {
        mocks.pushMock.mockReset();
        mocks.replaceMock.mockReset();
        mocks.refreshMock.mockReset();
        mocks.confirmBillingTransactionMock.mockReset();
        mocks.confirmGuestBillingTransactionMock.mockReset();
        mocks.fetchBillingAccountMock.mockReset();
        mocks.clearBillingErrorMock.mockReset();
        mocks.resetHandoff();
    });

    it("confirms the Paystack reference before falling back to account polling", async () => {
        mocks.confirmBillingTransactionMock.mockResolvedValue(createBillingAccount());

        render(<BillingSuccessPage />);

        await waitFor(() => {
            expect(mocks.confirmBillingTransactionMock).toHaveBeenCalledWith("ref_123");
        });

        expect(mocks.fetchBillingAccountMock).not.toHaveBeenCalled();
        expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
    });

    it("switches into account-creation mode when the payment belongs to a guest checkout", async () => {
        mocks.confirmBillingTransactionMock.mockRejectedValue(new Error("Sign-in is required before confirming payment."));
        mocks.confirmGuestBillingTransactionMock.mockResolvedValue({
            paid: true,
            email: "guest@example.com",
            planId: "pro",
        });

        render(<BillingSuccessPage />);

        expect(await screen.findByText("Payment confirmed. Create your account")).toBeInTheDocument();
        expect(await screen.findByTestId("signup-form")).toHaveTextContent("guest@example.com");
        expect(mocks.fetchBillingAccountMock).not.toHaveBeenCalled();
    });
});
