import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FreePayslipGenerator } from "./free-payslip-generator";

const mocks = vi.hoisted(() => ({
    useSearchParamsMock: vi.fn(() => new URLSearchParams("")),
    getUserMock: vi.fn(),
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
            getUser: mocks.getUserMock,
            signInWithOtp: mocks.signInWithOtpMock,
            signOut: mocks.signOutMock,
        },
    }),
}));

const VALID_DRAFT = {
    form: {
        employerName: "Nomsa Dlamini",
        employerAddress: "18 Acacia Avenue",
        employeeName: "Thandi Maseko",
        employeeId: "",
        employeeRole: "Domestic Worker",
        hourlyRate: "30.23",
        monthKey: "2026-03",
        standardWorkingDaysThisMonth: "22",
        ordinaryHoursOverride: "",
        overtimeHours: "0",
        sundayHours: "0",
        publicHolidayHours: "0",
        shortShiftCount: "0",
        shortShiftWorkedHours: "0",
        otherDeductions: "0",
    },
    currentStep: 4,
    verificationEmail: "owner@example.com",
};

describe("FreePayslipGenerator", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
        mocks.getUserMock.mockResolvedValue({ data: { user: null }, error: null });
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

    it("shows a service outage message instead of a verification loop when quota lookup fails", async () => {
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams("freePayslipVerification=success"));
        mocks.getUserMock.mockResolvedValue({
            data: { user: { email: "owner@example.com" } },
            error: null,
        });
        window.localStorage.setItem("free-payslip-wizard-draft", JSON.stringify(VALID_DRAFT));
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 503,
            ok: false,
            json: async () => ({ error: "Cloudflare D1 query failed." }),
        })));

        render(<FreePayslipGenerator />);

        await screen.findByText("The free payslip service is temporarily unavailable. Please try again in a moment.");
    });

    it("shows a same-browser recovery message when the callback returns without a session in this browser", async () => {
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams("freePayslipVerification=success"));
        window.localStorage.setItem("free-payslip-wizard-draft", JSON.stringify(VALID_DRAFT));

        render(<FreePayslipGenerator />);

        await screen.findByText("We found the verification link, but this browser is not signed in yet. Open the email link in the same browser where this form is open, then check again.");
        expect(screen.getByRole("button", { name: "I opened the link in this browser" })).toBeInTheDocument();
    });

    it("restores a bad saved draft safely without crashing", async () => {
        window.localStorage.setItem("free-payslip-wizard-draft", JSON.stringify({
            form: {
                monthKey: "not-a-real-month",
                employeeId: "1234567890",
            },
            currentStep: 999,
            verificationEmail: "owner@example.com",
        }));

        render(<FreePayslipGenerator />);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Create free payslip PDF" })).toBeInTheDocument();
        });
        expect(screen.getByText((_, node) => node?.textContent === "Step 5 of 5")).toBeInTheDocument();
        expect(screen.getByText("Review and generate the PDF")).toBeInTheDocument();
        expect(screen.getByText("Finish the earlier steps first so the review figures can be prepared.")).toBeInTheDocument();
    });
});
