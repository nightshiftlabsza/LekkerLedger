import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    pushMock: vi.fn(),
    getUserMock: vi.fn(),
    getSettingsMock: vi.fn(),
    createInlinePurchaseIntentMock: vi.fn(),
    writePendingBillingEmailMock: vi.fn(),
    writePendingBillingReferenceMock: vi.fn(),
    startAppMetricMock: vi.fn(),
    endAppMetricMock: vi.fn(),
    resumeTransactionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.pushMock,
    }),
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: mocks.getUserMock,
        },
    }),
}));

vi.mock("@/lib/storage", () => ({
    getSettings: mocks.getSettingsMock,
}));

vi.mock("@/lib/billing-client", () => ({
    createInlinePurchaseIntent: mocks.createInlinePurchaseIntentMock,
}));

vi.mock("@/lib/billing-handoff", () => ({
    writePendingBillingEmail: mocks.writePendingBillingEmailMock,
    writePendingBillingReference: mocks.writePendingBillingReferenceMock,
}));

vi.mock("@/lib/paid-activation", () => ({
    buildPaidDashboardHref: ({ reference }: { reference?: string | null }) => reference ? `/dashboard?reference=${reference}` : "/dashboard",
    buildPaidLoginHref: (reference?: string | null) => reference ? `/login?reference=${reference}` : "/login",
}));

vi.mock("@/lib/app-performance", () => ({
    startAppMetric: mocks.startAppMetricMock,
    endAppMetric: mocks.endAppMetricMock,
}));

vi.mock("@paystack/inline-js", () => ({
    default: class PaystackPopupMock {
        resumeTransaction(accessCode: string, handlers: {
            onLoad: () => void;
            onSuccess: (response: unknown) => void;
            onCancel: () => void;
            onError: (error: { message?: string } | undefined) => void;
        }) {
            return mocks.resumeTransactionMock(accessCode, handlers);
        }
    },
}));

import { InlinePlanCheckoutButton } from "./inline-paid-plan-checkout";

function TestCheckoutButton() {
    return (
        <InlinePlanCheckoutButton planId="standard" billingCycle="monthly">
            Choose Standard
        </InlinePlanCheckoutButton>
    );
}

function TestYearlyCheckoutButton() {
    return (
        <InlinePlanCheckoutButton planId="standard" billingCycle="yearly">
            Choose Standard yearly
        </InlinePlanCheckoutButton>
    );
}

async function openGuestModal() {
    render(<TestCheckoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Choose Standard" }));
    return await screen.findByLabelText("Email address");
}

describe("Inline paid plan checkout", () => {
    beforeEach(() => {
        if (!HTMLDialogElement.prototype.showModal) {
            HTMLDialogElement.prototype.showModal = function showModal() {
                this.open = true;
            };
        }

        if (!HTMLDialogElement.prototype.close) {
            HTMLDialogElement.prototype.close = function close() {
                this.open = false;
                this.dispatchEvent(new Event("close"));
            };
        }

        mocks.pushMock.mockReset();
        mocks.getUserMock.mockReset();
        mocks.getSettingsMock.mockReset();
        mocks.createInlinePurchaseIntentMock.mockReset();
        mocks.writePendingBillingEmailMock.mockReset();
        mocks.writePendingBillingReferenceMock.mockReset();
        mocks.startAppMetricMock.mockReset();
        mocks.endAppMetricMock.mockReset();
        mocks.resumeTransactionMock.mockReset();
        window.localStorage.clear();

        mocks.getUserMock.mockResolvedValue({ data: { user: null } });
        mocks.getSettingsMock.mockResolvedValue({});
        mocks.resumeTransactionMock.mockImplementation((_accessCode: string, handlers: { onLoad: () => void }) => {
            handlers.onLoad();
        });
    });

    it("shows the guest email-first copy, plan summary, and plain email field", async () => {
        await openGuestModal();

        expect(screen.getAllByText("We'll use this email for your receipt and account setup. Then you'll continue to secure Paystack payment.").length).toBeGreaterThan(0);
        expect(screen.getByLabelText("Email address")).toBeVisible();
        expect(screen.getByText("Selected plan")).toBeVisible();
        expect(screen.getByText("Standard plan - R29 today, then monthly")).toBeVisible();
        expect(screen.getByRole("button", { name: "Continue to secure payment" })).toBeVisible();

        const emailInput = screen.getByLabelText("Email address");
        expect(emailInput.className).not.toMatch(/\bpl-(10|11)\b/);

        const emailField = emailInput.closest("div");
        expect(emailField).not.toBeNull();
        expect(emailField ? within(emailField).queryByTestId("checkout-email-icon") : null).not.toBeInTheDocument();
        expect(emailField?.querySelector("svg")).toBeNull();
    });

    it("shows the live yearly Standard amount in the guest plan summary", async () => {
        render(<TestYearlyCheckoutButton />);
        fireEvent.click(screen.getByRole("button", { name: "Choose Standard yearly" }));

        await screen.findByLabelText("Email address");
        expect(screen.getByText("Standard plan - R299 today, then yearly")).toBeVisible();
    });

    it("validates the email before opening payment", async () => {
        await openGuestModal();

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "not-an-email" } });
        fireEvent.submit(screen.getByRole("button", { name: "Continue to secure payment" }).closest("form")!);

        expect(await screen.findByText("Enter a valid email address to continue.")).toBeVisible();
        expect(mocks.createInlinePurchaseIntentMock).not.toHaveBeenCalled();
    });

    it("prepares checkout and opens Paystack when the email is valid", async () => {
        mocks.createInlinePurchaseIntentMock.mockResolvedValue({
            reference: "ref_123",
            accessCode: "access_123",
            amountCents: 2900,
        });

        await openGuestModal();

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "guest@example.com" } });
        fireEvent.submit(screen.getByRole("button", { name: "Continue to secure payment" }).closest("form")!);

        await waitFor(() => {
            expect(mocks.resumeTransactionMock).toHaveBeenCalledWith(
                "access_123",
                expect.objectContaining({
                    onLoad: expect.any(Function),
                    onSuccess: expect.any(Function),
                    onCancel: expect.any(Function),
                    onError: expect.any(Function),
                }),
            );
        });

        expect(
            mocks.createInlinePurchaseIntentMock.mock.calls.some(([input]) =>
                input.planId === "standard"
                && input.billingCycle === "monthly"
                && input.email === "guest@example.com"
                && input.referralCode === null,
            ),
        ).toBe(true);
    });

    it("keeps failure copy customer-friendly without internal redirect wording", async () => {
        mocks.createInlinePurchaseIntentMock.mockRejectedValue(new Error("Secure payment could not be opened. Please try again."));

        await openGuestModal();

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "guest@example.com" } });
        fireEvent.submit(screen.getByRole("button", { name: "Continue to secure payment" }).closest("form")!);

        expect(await screen.findByText("Secure payment could not be opened. Please try again.")).toBeVisible();
        expect(screen.queryByText(/redirect/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/inline/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/popup/i)).not.toBeInTheDocument();
    });
});
