import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FreePayslipGenerator } from "./free-payslip-generator";

const mocks = vi.hoisted(() => ({
    useSearchParamsMock: vi.fn(() => new URLSearchParams("")),
    signInWithOtpMock: vi.fn(),
    signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: () => mocks.useSearchParamsMock(),
}));

vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: ReactNode; href?: string } & Record<string, unknown>) => <a href={typeof href === "string" ? href : "#"} {...props}>{children}</a>,
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            signInWithOtp: mocks.signInWithOtpMock,
            signOut: mocks.signOutMock,
        },
    }),
}));

describe("FreePayslipGenerator", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
        mocks.signInWithOtpMock.mockResolvedValue({ error: null });
        mocks.signOutMock.mockResolvedValue(undefined);
        window.localStorage.clear();
        window.sessionStorage.clear();
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 401,
            ok: false,
            json: async () => ({ error: "Verification required." }),
        })));
    });

    it("removes the wizard framing and keeps secondary fields hidden by default", async () => {
        window.localStorage.setItem("free-payslip-wizard-draft", JSON.stringify({
            form: { employerName: "Old wizard draft" },
            currentStep: 4,
        }));

        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Fill in a few obvious details." });
        expect(screen.queryByText("Build the payslip step by step.")).toBeNull();
        expect(screen.queryByText("Details")).toBeNull();
        expect(screen.queryByLabelText("Worker role")).toBeNull();
        expect(screen.queryByLabelText("ID or passport number")).toBeNull();
        expect(screen.queryByLabelText("Other deductions")).toBeNull();
        expect(screen.getByLabelText("Employer name")).toHaveValue("");
    });

    it("uses the preset buttons to explain the monthly maximum in plain English", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByText("How this month's normal-work maximum was worked out");
        expect(screen.getByText(/maximum normal days is 19/i)).toBeInTheDocument();
        expect(screen.getByText(/maximum normal hours is 152/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Monday to Saturday/i }));

        expect(screen.getByText(/maximum normal days is 23/i)).toBeInTheDocument();
        expect(screen.getByText(/maximum normal hours is 184/i)).toBeInTheDocument();
    });

    it("keeps custom days behind the custom preset and wires Sunday into the same schedule logic", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByText("Usual work week");
        expect(screen.queryByRole("button", { name: "Mon" })).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: /Custom days/i }));
        expect(screen.getByRole("button", { name: "Mon" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Yes Sunday is part of the usual schedule\./i }));
        expect(screen.getByText("Sunday is treated as part of the worker's usual schedule.")).toBeInTheDocument();
        expect(screen.getAllByText("Sunday is part of the usual schedule.").length).toBeGreaterThan(0);
    });

    it("keeps the compact summary visible and demotes detailed breakdown behind a toggle", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByText("Payslip summary and download");
        expect(screen.getByText("Gross pay")).toBeInTheDocument();
        expect(screen.queryByText(/Normal pay \(/)).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: /Detailed pay breakdown/i }));
        expect(screen.getByText(/Normal pay \(/)).toBeInTheDocument();
    });

    it("only enters the waiting state after Send unlock link is clicked", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Fill in a few obvious details." });
        fireEvent.change(screen.getByLabelText("Email for the unlock link"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send unlock link" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-waiting-for-verification")).toBeInTheDocument();
        });
        expect(mocks.signInWithOtpMock).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "I opened the link in this browser" })).toBeInTheDocument();
    });

    it("shows a compact ready state that swaps unlock actions for Download PDF", async () => {
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams("freePayslipVerification=success"));
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 200,
            ok: true,
            json: async () => ({
                email: "owner@example.com",
                monthKey: "2026-04",
                downloadsUsed: 0,
                remainingDownloads: 1,
                usedThisMonth: false,
            }),
        })));

        render(<FreePayslipGenerator />);

        await screen.findByTestId("free-payslip-gate-verified-ready");
        expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Send unlock link" })).toBeNull();
    });
});
