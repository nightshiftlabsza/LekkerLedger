import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month's work" }));
    }

    // The primary Step 2 path — confirms the standard month and advances directly.
    function fillStepTwo() {
        fireEvent.click(screen.getByRole("button", { name: "No, standard month" }));
    }

    async function reachStepThree() {
        render(<FreePayslipGenerator />);
        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });
        fillStepTwo();
        await screen.findByRole("heading", { name: "Review and email" });
    }

    it("renders the three-step wizard and keeps optional sections hidden at first", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        expect(screen.getByRole("button", { name: "Continue to this month's work" })).toBeInTheDocument();
        expect(screen.queryByLabelText("Employer name")).toBeNull();
        expect(screen.queryByLabelText("Job title")).toBeNull();
        expect(screen.queryByLabelText("ID or passport number")).toBeNull();
        // Questionnaire is not shown until "Yes, I need to make adjustments" is clicked
        expect(screen.queryByLabelText("Days they missed")).toBeNull();
    });

    it("preserves entered values when moving back and forward", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });

        // Advance to Step 3 using the standard month path
        fireEvent.click(screen.getByRole("button", { name: "No, standard month" }));
        await screen.findByRole("heading", { name: "Review and email" });

        // Go back through the steps and verify Step 1 values are preserved
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: /What happened in/i });

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: "Schedule and hourly rate" });
        expect(screen.getByDisplayValue("Thandi Maseko")).toBeInTheDocument();
    });

    it("clicking No standard month advances to review without showing the questionnaire", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });

        // Questionnaire card should not be visible
        expect(screen.queryByText(/Did the worker miss any days without pay/i)).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "No, standard month" }));
        await screen.findByRole("heading", { name: "Review and email" });
    });

    it("reveals the questionnaire when Yes I need to make adjustments is clicked", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });

        expect(screen.queryByText(/Did the worker miss any days without pay/i)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        expect(screen.getByText(/Did the worker miss any days without pay/i)).toBeInTheDocument();
    });

    it("reveals unpaid leave input when Yes they did is clicked for Question A", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        expect(screen.queryByLabelText("Days they missed")).toBeNull();

        fireEvent.click(screen.getAllByRole("button", { name: "Yes, they did" })[0]);
        expect(screen.getByLabelText("Days they missed")).toBeInTheDocument();
    });

    it("shows the computed days worked when days missed is entered", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        // Click the first "Yes, they did" button (Question A — unpaid leave)
        const yesBtns = screen.getAllByRole("button", { name: "Yes, they did" });
        fireEvent.click(yesBtns[0]);

        const daysMissedInput = screen.getByLabelText("Days they missed");
        fireEvent.change(daysMissedInput, { target: { value: "2" } });

        // Should show "That means they worked X days this month."
        expect(screen.getByText(/That means they worked/i)).toBeInTheDocument();
    });

    it("reveals short days inputs when Question D is answered Yes", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter the monthly pay details" });
        fillStepOne();
        await screen.findByRole("heading", { name: /What happened in/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        expect(screen.queryByLabelText("How many short days?")).toBeNull();

        // "Yes, they did" buttons appear for each question; find the one for Question D (short days)
        // — it's the one nearest the "under 4 hours" question text
        const shortDaysYesBtn = screen.getAllByRole("button", { name: "Yes, they did" });
        // Question D (short days) is always the last "Yes, they did" button (A=0, C=1, D=last)
        // Question B uses "Yes, they worked" so doesn't affect this count
        fireEvent.click(shortDaysYesBtn[shortDaysYesBtn.length - 1]);
        expect(screen.getByLabelText("How many short days?")).toBeInTheDocument();
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
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month's work" }));

        await screen.findByRole("heading", { name: /What happened in/i });
        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        // Sunday-only schedule has no holidays, so no Question B.
        // "Yes, they did" order: A=0, C=1 (overtime/Sunday), D=2. Click C to reveal Sunday hours.
        fireEvent.click(screen.getAllByRole("button", { name: "Yes, they did" })[1]);

        // Open the Sunday hours InfoTip to reveal the rate text in the DOM
        const sundayInput = document.getElementById("free-sunday-hours")!;
        const sundayLabel = sundayInput.closest("label")!;
        fireEvent.click(within(sundayLabel).getByRole("button", { name: "More information" }));

        expect(screen.getByText(/Sunday hours are paid at 1\.5x/i)).toBeInTheDocument();
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
        await screen.findByRole("heading", { name: /What happened in/i });
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
        expect(screen.getByText("Amount to pay")).toBeInTheDocument();
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
