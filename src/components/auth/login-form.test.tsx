import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    pushMock: vi.fn(),
    signInWithPasswordMock: vi.fn(),
    startAppMetricMock: vi.fn(),
    storeCredentialHandoffMock: vi.fn(),
    searchParamsValue: "",
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mocks.pushMock,
    }),
    useSearchParams: () => new URLSearchParams(mocks.searchParamsValue),
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

vi.mock("@/lib/app-performance", () => ({
    startAppMetric: (...args: unknown[]) => mocks.startAppMetricMock(...args),
}));

vi.mock("@/lib/credential-handoff", () => ({
    storeCredentialHandoff: (...args: unknown[]) => mocks.storeCredentialHandoffMock(...args),
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
        mocks.startAppMetricMock.mockReset();
        mocks.storeCredentialHandoffMock.mockReset();
        mocks.searchParamsValue = "";
    });

    it("routes signed-in users into the dashboard bootstrap path", async () => {
        mocks.signInWithPasswordMock.mockResolvedValue({ error: null });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard");
        });

        expect(mocks.storeCredentialHandoffMock).toHaveBeenCalledWith("person@example.com", "Password123!");
    });

    it("continues paid users into dashboard activation when a payment reference is present", async () => {
        mocks.signInWithPasswordMock.mockResolvedValue({ error: null });
        mocks.searchParamsValue = "reference=ref_123";

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard?paidLogin=1&reference=ref_123");
        });
    });

    it("can lock the billing email during activation handoff", async () => {
        mocks.signInWithPasswordMock.mockResolvedValue({ error: null });

        render(<LoginForm initialEmail="locked@example.com" lockEmail />);

        const emailInput = screen.getByLabelText("Email address") as HTMLInputElement;
        expect(emailInput.value).toBe("locked@example.com");
        expect(emailInput.readOnly).toBe(true);

        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mocks.signInWithPasswordMock).toHaveBeenCalledWith({
                email: "locked@example.com",
                password: "Password123!",
            });
        });
    });
});
