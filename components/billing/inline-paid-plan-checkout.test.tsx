import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInlinePaidPlanCheckout } from "./inline-paid-plan-checkout";

const { push, resumeTransaction, createCheckoutSession } = vi.hoisted(() => ({
    push: vi.fn(),
    resumeTransaction: vi.fn(),
    createCheckoutSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push,
    }),
}));

vi.mock("@paystack/inline-js", () => ({
    default: class MockPaystackPop {
        resumeTransaction = resumeTransaction;
    },
}));

vi.mock("@/lib/billing-client", () => ({
    createCheckoutSession,
    createInlinePurchaseIntent: vi.fn(),
}));

vi.mock("@/lib/billing-handoff", () => ({
    writePendingBillingCheckoutState: vi.fn(),
    writePendingBillingEmail: vi.fn(),
    writePendingBillingReference: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: {
                    session: {
                        user: {
                            email: "owner@example.com",
                        },
                    },
                },
            }),
        },
    }),
}));

vi.mock("@/lib/env", () => ({
    getRequiredEnvValue: vi.fn(() => "pk_live_example"),
}));

vi.mock("./paid-plan-checkout-dialog", () => ({
    PaidPlanCheckoutDialog: ({
        open,
        children,
    }: {
        open: boolean;
        children: React.ReactNode;
    }) => (open ? <div data-testid="paid-plan-checkout-modal">{children}</div> : null),
}));

describe("useInlinePaidPlanCheckout", () => {
    beforeEach(() => {
        resumeTransaction.mockReset();
        createCheckoutSession.mockReset();
        push.mockReset();
    });

    function Harness() {
        const { startCheckout, dialog } = useInlinePaidPlanCheckout({ billingCycle: "monthly" });

        return (
            <>
                <button type="button" onClick={() => startCheckout("pro")}>
                    Upgrade now
                </button>
                {dialog}
            </>
        );
    }

    it("uses Paystack inline checkout by default for signed-in upgrades", async () => {
        createCheckoutSession.mockResolvedValue({
            authorizationUrl: "https://paystack.example/hosted",
            accessCode: "ACS_inline_123",
            reference: "ref_inline_123",
            checkoutMode: "inline",
            proration: {
                amountDueNowCents: 1000,
                creditAppliedCents: 500,
                remainingFraction: 0.5,
                nextRenewalDate: "2026-04-19T00:00:00.000Z",
                nextRecurringAmountCents: 4900,
                currency: "ZAR",
            },
        });
        resumeTransaction.mockImplementation((_accessCode, options: { onSuccess: (transaction: { reference?: string }) => void }) => {
            options.onSuccess({ reference: "ref_inline_success" });
        });

        render(
            <Harness />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Upgrade now" }));
        fireEvent.click(await screen.findByRole("button", { name: "Review payment" }));
        fireEvent.click(await screen.findByRole("button", { name: /Pay R.*10,00 now/ }));

        await waitFor(() => {
            expect(createCheckoutSession).toHaveBeenCalledWith({
                planId: "pro",
                billingCycle: "monthly",
            });
            expect(resumeTransaction).toHaveBeenCalledTimes(1);
            expect(resumeTransaction).toHaveBeenCalledWith("ACS_inline_123", expect.objectContaining({
                key: "pk_live_example",
            }));
            expect(push).toHaveBeenCalledWith("/billing/activate?reference=ref_inline_success");
        });
    });

    it("falls back to redirect only when checkout requires it", async () => {
        const assignSpy = vi.fn();
        Object.defineProperty(globalThis, "location", {
            configurable: true,
            value: {
                ...window.location,
                assign: assignSpy,
                pathname: "/settings",
                search: "",
            },
        });

        createCheckoutSession.mockResolvedValue({
            authorizationUrl: "https://paystack.example/redirect",
            accessCode: "",
            reference: "ref_redirect_123",
            checkoutMode: "redirect",
        });

        render(
            <Harness />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Upgrade now" }));
        fireEvent.click(await screen.findByRole("button", { name: "Review payment" }));
        fireEvent.click(await screen.findByRole("button", { name: "Continue to secure payment" }));

        await waitFor(() => {
            expect(assignSpy).toHaveBeenCalledWith("https://paystack.example/redirect");
            expect(resumeTransaction).not.toHaveBeenCalled();
            expect(push).not.toHaveBeenCalled();
        });
    });
});
