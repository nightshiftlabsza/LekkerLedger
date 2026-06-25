import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

import { ForgotPasswordForm } from "./forgot-password-form";

describe("ForgotPasswordForm", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("asks the app API to send the reset email", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true }),
        } as Response);

        render(<ForgotPasswordForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

        await waitFor(() => {
            expect(screen.getByText("Reset email sent")).toBeInTheDocument();
        });

        expect(fetchMock).toHaveBeenCalledWith("/api/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: "person@example.com" }),
        });
    });

    it("shows a friendly message for browser load failures", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            json: async () => ({ error: "Load failed" }),
        } as Response);

        render(<ForgotPasswordForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

        await waitFor(() => {
            expect(screen.getByText("Unable to reach the server. Please check your internet connection and try again.")).toBeInTheDocument();
        });
    });

    it("shows a friendly message when the reset request cannot be sent", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Failed to fetch"));

        render(<ForgotPasswordForm />);

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

        await waitFor(() => {
            expect(screen.getByText("Unable to reach the server. Please check your internet connection and try again.")).toBeInTheDocument();
        });
    });
});
