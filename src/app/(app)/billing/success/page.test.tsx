import * as React from "react";
import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const confirmBillingTransactionMock = vi.fn();
const fetchBillingAccountMock = vi.fn();
const hasStoredGoogleSessionMock = vi.fn();
const paidLoginButtonMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
    useSearchParams: () => new URLSearchParams("reference=ref_123"),
}));

vi.mock("@/lib/billing-client", () => ({
    confirmBillingTransaction: (...args: unknown[]) => confirmBillingTransactionMock(...args),
    fetchBillingAccount: (...args: unknown[]) => fetchBillingAccountMock(...args),
}));

vi.mock("@/lib/google-session", () => ({
    hasStoredGoogleSession: () => hasStoredGoogleSessionMock(),
}));

vi.mock("@/components/paid-login-button", () => ({
    PaidLoginButton: (props: { label: string; nextPath?: string | null; showInlineError?: boolean; skipPaidChecks?: boolean }) => {
        paidLoginButtonMock(props);
        return <button type="button">{props.label}</button>;
    },
}));

import BillingSuccessPage from "./page";

function createBillingAccount() {
    return {
        entitlements: {
            planId: "pro",
            billingCycle: "yearly",
            status: "active",
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            isActive: true,
        },
        account: {
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            successfulReferralCount: 0,
            totalReferralMonthsEarned: 0,
            nextChargeAt: "2027-03-10T21:08:55.000Z",
        },
    };
}

describe("BillingSuccessPage", () => {
    beforeEach(() => {
        pushMock.mockReset();
        confirmBillingTransactionMock.mockReset();
        fetchBillingAccountMock.mockReset();
        hasStoredGoogleSessionMock.mockReset();
        paidLoginButtonMock.mockReset();
        hasStoredGoogleSessionMock.mockReturnValue(true);
    });

    it("confirms the Paystack reference before falling back to account polling", async () => {
        confirmBillingTransactionMock.mockResolvedValue(createBillingAccount());

        render(<BillingSuccessPage />);

        await waitFor(() => {
            expect(confirmBillingTransactionMock).toHaveBeenCalledWith("ref_123");
        });

        expect(fetchBillingAccountMock).not.toHaveBeenCalled();
        expect(await screen.findByText("Thank you, payment confirmed")).toBeInTheDocument();
    });

    it("finishes Google activation with the paid checks still enabled", async () => {
        hasStoredGoogleSessionMock.mockReturnValue(false);

        render(<BillingSuccessPage />);

        expect(await screen.findByText("Thank you for your order")).toBeInTheDocument();
        expect(paidLoginButtonMock).toHaveBeenCalledWith(expect.objectContaining({
            label: "Enable Google account & Drive backup",
        }));
        expect(paidLoginButtonMock.mock.calls[0]?.[0]).not.toHaveProperty("skipPaidChecks");
    });
});
