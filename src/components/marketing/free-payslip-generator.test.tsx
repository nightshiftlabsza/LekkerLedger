import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FreePayslipGenerator } from "./free-payslip-generator";

describe("FreePayslipGenerator", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 200,
            ok: true,
            json: async () => ({
                status: "sent",
                email: "owner@example.com",
                monthKey: "2026-04",
            }),
        })));
    });

    function getDraft() {
        return JSON.parse(window.localStorage.getItem("free-payslip-simple-draft-v1") || "null") as {
            email?: string;
            marketingConsent?: boolean;
        } | null;
    }

    function fillStepOne() {
        fireEvent.change(screen.getByLabelText("Worker name"), { target: { value: "Thandi Maseko" } });
        fireEvent.click(screen.getByRole("button", { name: /Payslip details/i }));
        fireEvent.change(screen.getByLabelText("Employer name"), { target: { value: "Nomsa Dlamini" } });
        fireEvent.change(screen.getByLabelText("Employer address"), { target: { value: "18 Acacia Avenue" } });
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month’s work" }));
    }

    function fillStepTwo() {
        const daysInput = document.getElementById("free-ordinary-days");
        if (!daysInput) {
            throw new Error("Days worked input not found");
        }
        fireEvent.change(daysInput, { target: { value: "19" } });
        fireEvent.click(screen.getByRole("button", { name: "Review the payslip" }));
    }

    async function reachStepThree() {
        render(<FreePayslipGenerator />);
        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: "How much did she work this month?" });
        fillStepTwo();
        await screen.findByRole("heading", { name: "Review and email" });
    }

    it("renders the three-step wizard and keeps optional sections hidden at first", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        expect(screen.getByRole("button", { name: "Continue to this month’s work" })).toBeInTheDocument();
        expect(screen.queryByLabelText("Employer name")).toBeNull();
        expect(screen.queryByLabelText("Job title")).toBeNull();
        expect(screen.queryByLabelText("ID or passport number")).toBeNull();
        expect(screen.queryByLabelText("Anything deducted from her pay")).toBeNull();
    });

    it("preserves entered values when moving back and forward", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: "How much did she work this month?" });

        const daysInput = document.getElementById("free-ordinary-days");
        if (!daysInput) {
            throw new Error("Days worked input not found");
        }
        fireEvent.change(daysInput, { target: { value: "12" } });
        fireEvent.click(screen.getByRole("button", { name: "Review the payslip" }));
        await screen.findByRole("heading", { name: "Review and email" });

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: "How much did she work this month?" });
        expect(document.getElementById("free-ordinary-days")).toHaveValue(12);

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: "Her schedule and hourly rate" });
        expect(screen.getByDisplayValue("Thandi Maseko")).toBeInTheDocument();
    });

    it("fills the full month shortcut and keeps the optional section closed", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: "How much did she work this month?" });
        fireEvent.click(screen.getByRole("button", { name: "She worked the full month" }));

        expect(document.getElementById("free-ordinary-days")).toHaveValue(19);
        expect(screen.queryByLabelText("Anything deducted from her pay")).toBeNull();
    });

    it("reveals partial-day hours only when the toggle is opened", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: "How much did she work this month?" });

        expect(screen.queryByLabelText("Total normal hours worked")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /She sometimes works partial days/i }));
        expect(screen.getByLabelText(/Total normal hours worked/i)).toBeInTheDocument();
    });

    it("updates the Sunday helper text when the normal schedule changes", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fireEvent.change(screen.getByLabelText("Worker name"), { target: { value: "Thandi Maseko" } });
        fireEvent.click(screen.getByRole("button", { name: /Other days/i }));
        fireEvent.click(screen.getByRole("button", { name: "Sun" }));
        fireEvent.click(screen.getByRole("button", { name: /Payslip details/i }));
        fireEvent.change(screen.getByLabelText("Employer name"), { target: { value: "Nomsa Dlamini" } });
        fireEvent.change(screen.getByLabelText("Employer address"), { target: { value: "18 Acacia Avenue" } });
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month’s work" }));

        await screen.findByRole("heading", { name: "How much did she work this month?" });
        fireEvent.click(screen.getByRole("button", { name: /Anything else\?/i }));
        expect(screen.getByText(/Sunday hours are paid at 1\.5x/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: "Her schedule and hourly rate" });
        fireEvent.click(screen.getByRole("button", { name: /Monday to Friday/i }));
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month’s work" }));
        await screen.findByRole("heading", { name: "How much did she work this month?" });
        expect(screen.getByText(/Sunday hours are paid at 2x/i)).toBeInTheDocument();
    });

    it("shows an inline warning when hours exceed the new schedule cap", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: "How much did she work this month?" });
        fireEvent.click(screen.getByRole("button", { name: /She sometimes works partial days/i }));
        fireEvent.change(screen.getByLabelText(/Total normal hours worked/i), { target: { value: "200" } });
        expect(screen.getByText(/This schedule allows up to 152 normal hours this month\./i)).toBeInTheDocument();
    });

    it("keeps the marketing opt-in unchecked on a fresh visit and persists it when selected", async () => {
        await reachStepThree();

        const checkbox = screen.getByRole("checkbox", { name: /send me a free monthly household employer checklist and tips/i });
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(getDraft()).toMatchObject({
                marketingConsent: true,
            });
        });
    });

    it("restores saved marketing consent from draft data", async () => {
        window.localStorage.setItem("free-payslip-simple-draft-v1", JSON.stringify({
            form: {
                employerName: "",
                employerAddress: "",
                employeeName: "",
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
                ordinaryDaysWorked: "0",
                ordinaryHoursOverride: "",
                overtimeHours: "0",
                sundayHours: "0",
                publicHolidayHours: "0",
                shortShiftCount: "0",
                shortShiftWorkedHours: "0",
                otherDeductions: "0",
            },
            email: "owner@example.com",
            marketingConsent: true,
        }));

        render(<FreePayslipGenerator />);
        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: "How much did she work this month?" });
        fillStepTwo();
        await screen.findByRole("heading", { name: "Review and email" });

        expect(screen.getByRole("checkbox", { name: /send me a free monthly household employer checklist and tips/i })).toBeChecked();
    });

    it("shows the combined review summary and success state after a successful send", async () => {
        await reachStepThree();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-success")).toBeInTheDocument();
        });
        expect(screen.getByText("Amount to pay her")).toBeInTheDocument();
        expect(screen.getByText("UIF total")).toBeInTheDocument();
        expect(screen.getByText("Payslip sent to owner@example.com")).toBeInTheDocument();
    });

    it("sends the marketing opt-in state in the request body", async () => {
        const fetchMock = vi.fn(async () => ({
            status: 200,
            ok: true,
            json: async () => ({
                status: "sent",
                email: "owner@example.com",
                monthKey: "2026-04",
            }),
        }));
        vi.stubGlobal("fetch", fetchMock);

        await reachStepThree();
        fireEvent.click(screen.getByRole("checkbox", { name: /send me a free monthly household employer checklist and tips/i }));
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(JSON.parse(String(requestInit.body))).toMatchObject({
            email: "owner@example.com",
            marketingConsent: true,
        });
    });

    it("shows the monthly limit and service-unavailable states cleanly", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 409,
            ok: false,
            json: async () => ({
                error: "This email address has already used its one successful free payslip PDF for this calendar month.",
            }),
        })));

        await reachStepThree();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-quota-used")).toBeInTheDocument();
        });
        expect(screen.getByText("This email address has already used its one successful free payslip PDF for this calendar month.")).toBeInTheDocument();

        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 503,
            ok: false,
            json: async () => ({
                error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
            }),
        })));

        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-service-unavailable")).toBeInTheDocument();
        });
        expect(screen.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeInTheDocument();
    });
});
