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

const VALID_DRAFT = {
    form: {
        employerName: "Nomsa Dlamini",
        employerAddress: "18 Acacia Avenue",
        employeeName: "Thandi Maseko",
        employeeId: "",
        employeeRole: "Domestic Worker",
        hourlyRate: "30.23",
        monthKey: "2026-04",
        ordinaryWorkPattern: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
        },
        ordinaryDaysWorked: "19",
        ordinaryHoursOverride: "",
        overtimeHours: "2",
        sundayHours: "0",
        publicHolidayHours: "0",
        shortShiftCount: "0",
        shortShiftWorkedHours: "0",
        otherDeductions: "0",
    },
    currentStep: 4,
    furthestStepReached: 4,
    verificationEmail: "owner@example.com",
};

function saveDraft(overrides?: Partial<typeof VALID_DRAFT>) {
    const nextDraft = {
        ...VALID_DRAFT,
        ...overrides,
        form: {
            ...VALID_DRAFT.form,
            ...overrides?.form,
        },
    };
    window.localStorage.setItem("free-payslip-wizard-draft", JSON.stringify(nextDraft));
    return nextDraft;
}

describe("FreePayslipGenerator", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
        mocks.signInWithOtpMock.mockResolvedValue({ error: null });
        mocks.signOutMock.mockResolvedValue(undefined);
        window.localStorage.clear();
        window.sessionStorage.clear();
        saveDraft();
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 401,
            ok: false,
            json: async () => ({ error: "Verification required." }),
        })));
    });

    it("keeps the verification state idle while the email field is being typed", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Build the payslip step by step." });
        expect(screen.getByTestId("free-payslip-gate-idle")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Verification email"), { target: { value: "owner@exam" } });

        expect(screen.getByLabelText("Verification email")).toHaveValue("owner@exam");
        expect(screen.getByTestId("free-payslip-gate-idle")).toBeInTheDocument();
        expect(screen.queryByTestId("free-payslip-gate-waiting-for-verification")).toBeNull();
    });

    it("only enters the waiting state after Send verification link is clicked", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Build the payslip step by step." });
        fireEvent.change(screen.getByLabelText("Verification email"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send verification link" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-waiting-for-verification")).toBeInTheDocument();
        });
        expect(mocks.signInWithOtpMock).toHaveBeenCalledTimes(1);
    });

    it("shows a service outage message instead of a verification loop when quota lookup fails", async () => {
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams("freePayslipVerification=success"));
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 503,
            ok: false,
            json: async () => ({ error: "Cloudflare D1 query failed." }),
        })));

        render(<FreePayslipGenerator />);

        await screen.findByText("The free payslip service is temporarily unavailable. Please try again in a moment.");
        expect(screen.getByTestId("free-payslip-gate-service-unavailable")).toBeInTheDocument();
    });

    it("shows the missing-session recovery state when the callback cannot confirm this browser", async () => {
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams("freePayslipVerification=missing-session"));

        render(<FreePayslipGenerator />);

        await screen.findByText(/We could not confirm this email in this browser yet\./);
        expect(screen.getByTestId("free-payslip-gate-missing-session")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "I opened the link in this browser" })).toBeInTheDocument();
    });

    it("shows the monthly quota copy once and explains why Generate PDF is locked", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByText("One successful free payslip PDF per verified email per calendar month. Verify the same email in this browser to unlock the download.");
        expect(screen.getAllByText(/One successful free payslip PDF per verified email per calendar month\./)).toHaveLength(1);
        expect(screen.getByRole("button", { name: "Generate PDF" })).toBeDisabled();
        expect(screen.getByText("Generate PDF unlocks after this email is verified in this browser.")).toBeInTheDocument();
    });

    it("makes Sunday treatment explicit and keeps the multiplier tied to the same pattern state", async () => {
        window.localStorage.clear();
        saveDraft({
            currentStep: 1,
            furthestStepReached: 1,
            form: {
                ordinaryWorkPattern: {
                    monday: true,
                    tuesday: true,
                    wednesday: true,
                    thursday: true,
                    friday: true,
                    saturday: false,
                    sunday: false,
                },
            },
        });

        render(<FreePayslipGenerator />);

        await screen.findByText("Does the worker ordinarily work Sundays?");
        expect(screen.getByText("No. Sunday hours will be paid at 2.0x.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Sun" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Yes/ }));

        expect(screen.getByText("Yes. Sunday hours will be paid at 1.5x.")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Continue" }));

        await screen.findByRole("heading", { name: "Overtime, Sunday, and public holiday hours" });
        expect(screen.getByText("Paid at 1.5x because Sunday is part of the ordinary work pattern.")).toBeInTheDocument();
    });

    it("shows an actionable ordinary-hours helper before any work pattern is selected", async () => {
        window.localStorage.clear();
        saveDraft({
            currentStep: 1,
            furthestStepReached: 1,
            form: {
                ordinaryWorkPattern: {
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                    sunday: false,
                },
                ordinaryDaysWorked: "0",
                ordinaryHoursOverride: "",
            },
        });

        render(<FreePayslipGenerator />);

        await screen.findAllByText("Select the ordinary work pattern first to calculate the cap.");
        expect(screen.queryByText(/Maximum allowed: 0 hours\./)).toBeNull();
    });

    it("adds review edit actions that jump back to the correct step", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("button", { name: "Edit extra pay" });
        fireEvent.click(screen.getByRole("button", { name: "Edit extra pay" }));

        expect(screen.getByRole("heading", { name: "Overtime, Sunday, and public holiday hours" })).toBeInTheDocument();
    });
});
