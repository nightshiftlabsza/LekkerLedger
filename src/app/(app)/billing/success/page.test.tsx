import * as React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BillingSuccessPage from "@/app/billing/success/page";

const mocks = vi.hoisted(() => {
    let pendingReference = "";
    let pendingEmail = "";

    return {
        replaceMock: vi.fn(),
        confirmGuestBillingTransactionMock: vi.fn(),
        fetchBillingAccountMock: vi.fn(),
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
        writePendingEmail(email: string) {
            pendingEmail = email;
        },
    };
});

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mocks.replaceMock,
    }),
    useSearchParams: () => new URLSearchParams("reference=ref_123"),
}));

vi.mock("@/lib/billing-client", () => ({
    confirmGuestBillingTransaction: (...args: unknown[]) => mocks.confirmGuestBillingTransactionMock(...args),
    fetchBillingAccount: (...args: unknown[]) => mocks.fetchBillingAccountMock(...args),
}));

vi.mock("@/lib/billing-handoff", () => ({
    readPendingBillingReference: () => mocks.readPendingReference(),
    writePendingBillingEmail: (email: string) => mocks.writePendingEmail(email),
    writePendingBillingReference: (reference: string) => mocks.writePendingReference(reference),
}));

describe("BillingSuccessPage route-group coverage", () => {
    beforeEach(() => {
        mocks.replaceMock.mockReset();
        mocks.confirmGuestBillingTransactionMock.mockReset();
        mocks.fetchBillingAccountMock.mockReset();
        mocks.resetHandoff();
    });

    it("routes authenticated users to dashboard activation", async () => {
        mocks.fetchBillingAccountMock.mockResolvedValue({
            entitlements: {
                planId: "free",
                billingCycle: "monthly",
                status: "free",
                cancelAtPeriodEnd: false,
                availableReferralMonths: 0,
                pendingReferralMonths: 0,
                isActive: false,
            },
            account: {
                cancelAtPeriodEnd: false,
                availableReferralMonths: 0,
                pendingReferralMonths: 0,
                successfulReferralCount: 0,
                totalReferralMonthsEarned: 0,
            },
        });

        render(<BillingSuccessPage />);

        await waitFor(() => {
            expect(mocks.replaceMock).toHaveBeenCalledWith("/dashboard?paidLogin=1&reference=ref_123");
        });
    });

    it("routes anonymous users to paid login", async () => {
        mocks.fetchBillingAccountMock.mockResolvedValue(null);
        mocks.confirmGuestBillingTransactionMock.mockResolvedValue({
            paid: true,
            email: "guest@example.com",
            planId: "standard",
        });

        render(<BillingSuccessPage />);

        await waitFor(() => {
            expect(mocks.replaceMock).toHaveBeenCalledWith("/login?reference=ref_123");
        });
    });
});
