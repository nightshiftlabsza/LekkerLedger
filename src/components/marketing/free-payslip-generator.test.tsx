import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FreePayslipGenerator } from "./free-payslip-generator";

const analyticsMocks = vi.hoisted(() => ({
    trackMock: vi.fn(),
}));

const legalRegistryMocks = vi.hoisted(() => ({
    getNMWForDateMock: vi.fn(() => 28),
}));

vi.mock("@/lib/analytics", () => ({
    track: (...args: unknown[]) => analyticsMocks.trackMock(...args),
}));

vi.mock("@/lib/legal/registry", async () => {
    const actual = await vi.importActual<typeof import("@/lib/legal/registry")>("@/lib/legal/registry");
    return {
        ...actual,
        getNMWForDate: (...args: unknown[]) => legalRegistryMocks.getNMWForDateMock(...args),
    };
});

describe("FreePayslipGenerator", () => {
    beforeEach(() => {
        window.localStorage.clear();
        analyticsMocks.trackMock.mockReset();
        legalRegistryMocks.getNMWForDateMock.mockReset();
        legalRegistryMocks.getNMWForDateMock.mockImplementation(() => 28);
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
        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });
        fillStepTwo();
        await screen.findByRole("heading", { name: "Review and email" });
    }

    it("renders the three-step wizard and keeps optional sections hidden at first", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        expect(screen.getByRole("button", { name: "Continue to this month's work" })).toBeInTheDocument();
        expect(screen.queryByLabelText("Employer name")).toBeNull();
        expect(screen.queryByLabelText("Job title")).toBeNull();
        expect(screen.queryByLabelText("ID or passport number")).toBeNull();
        // Questionnaire is not shown until "Yes, I need to make adjustments" is clicked
        expect(screen.queryByLabelText("Days they missed")).toBeNull();
    });

    it("preserves entered values when moving back and forward", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        // Advance to Step 3 using the standard month path
        fireEvent.click(screen.getByRole("button", { name: "No, standard month" }));
        await screen.findByRole("heading", { name: "Review and email" });

        // Go back through the steps and verify Step 1 values are preserved
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: /Normal month for/i });

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: "Schedule and hourly rate" });
        expect(screen.getByDisplayValue("Thandi Maseko")).toBeInTheDocument();
    });

    it("clicking No standard month advances to review without showing the questionnaire", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        // Questionnaire card should not be visible
        expect(screen.queryByText(/Did the worker miss any days without pay/i)).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "No, standard month" }));
        await screen.findByRole("heading", { name: "Review and email" });
    });

    it("reveals the questionnaire when Yes I need to make adjustments is clicked", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        expect(screen.queryByText(/Did the worker miss any days without pay/i)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        expect(screen.getByText(/Did the worker miss any days without pay/i)).toBeInTheDocument();
    });

    it("reveals unpaid leave input when Yes they did is clicked for Question A", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        expect(screen.queryByLabelText("Days they missed")).toBeNull();

        fireEvent.click(within(screen.getByRole("group", { name: /Did the worker miss any days without pay\?/i })).getByRole("button", { name: "Yes, they did" }));
        expect(screen.getByLabelText("Days they missed")).toBeInTheDocument();
    });

    it("shows the computed days worked when days missed is entered", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        // Click the unpaid leave "Yes" button.
        fireEvent.click(within(screen.getByRole("group", { name: /Did the worker miss any days without pay\?/i })).getByRole("button", { name: "Yes, they did" }));

        const daysMissedInput = screen.getByLabelText("Days they missed");
        fireEvent.change(daysMissedInput, { target: { value: "2" } });

        // Should show "That means they worked X days this month."
        expect(screen.getByText(/That means they worked/i)).toBeInTheDocument();
    });

    it("reveals short days inputs when Question D is answered Yes", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        expect(screen.queryByLabelText("How many short days?")).toBeNull();

        fireEvent.click(within(screen.getByRole("group", { name: /Did the worker do any very short days/i })).getByRole("button", { name: "Yes, they did" }));
        expect(screen.getByLabelText("How many short days?")).toBeInTheDocument();
    });

    it("reveals separate premium-time fields for public holidays, overtime, and Sundays", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });

        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));

        const publicHolidayGroup = screen.getByRole("group", { name: /Did the worker work on any South African public holidays this month\?/i });
        expect(screen.queryByRole("spinbutton", { name: /Hours worked on public holidays/i })).toBeNull();
        fireEvent.click(within(publicHolidayGroup).getByRole("button", { name: "Yes" }));
        expect(screen.getByRole("spinbutton", { name: /Hours worked on public holidays/i })).toBeInTheDocument();

        const overtimeGroup = screen.getByRole("group", { name: /Did the worker do any overtime\?/i });
        expect(screen.queryByRole("spinbutton", { name: /Hours beyond the normal schedule \(overtime\)/i })).toBeNull();
        fireEvent.click(within(overtimeGroup).getByRole("button", { name: "Yes" }));
        expect(screen.getByRole("spinbutton", { name: /Hours beyond the normal schedule \(overtime\)/i })).toBeInTheDocument();

        const sundayGroup = screen.getByRole("group", { name: /Did the worker work on a Sunday\?/i });
        expect(screen.queryByLabelText("Sunday hours")).toBeNull();
        fireEvent.click(within(sundayGroup).getByRole("button", { name: "Yes" }));
        expect(screen.getByRole("spinbutton", { name: /Sunday hours/i })).toBeInTheDocument();
    });

    it("shows the Sunday rule helper and the month holiday helper", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fireEvent.change(screen.getByLabelText("Worker name"), { target: { value: "Thandi Maseko" } });
        fireEvent.click(screen.getByRole("button", { name: /Other days/i }));
        fireEvent.click(screen.getByRole("button", { name: "Sun" }));
        fireEvent.click(screen.getByRole("button", { name: /Payslip details/i }));
        fireEvent.change(screen.getByLabelText("Employer name"), { target: { value: "Nomsa Dlamini" } });
        fireEvent.change(screen.getByLabelText("Employer address"), { target: { value: "18 Acacia Avenue" } });
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month's work" }));

        await screen.findByRole("heading", { name: /Normal month for/i });
        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        const sundayGroup = screen.getByRole("group", { name: /Did the worker work on a Sunday\?/i });
        fireEvent.click(within(sundayGroup).getByRole("button", { name: "Yes" }));
        fireEvent.click(screen.getByRole("button", { name: "Show Sunday pay rule" }));
        expect(screen.getByText(/1\.5x the normal hourly rate/i)).toBeInTheDocument();
        expect(screen.getByText(/existing Sunday minimum-pay rule stays unchanged/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        await screen.findByRole("heading", { name: "Schedule and hourly rate" });
        fireEvent.click(screen.getByRole("button", { name: /Monday to Friday/i }));
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month's work" }));
        await screen.findByRole("heading", { name: /Normal month for/i });
        fireEvent.click(screen.getByRole("button", { name: "Yes, I need to make adjustments" }));
        fireEvent.click(within(screen.getByRole("group", { name: /Did the worker work on a Sunday\?/i })).getByRole("button", { name: "Yes" }));
        fireEvent.click(screen.getByRole("button", { name: "Show Sunday pay rule" }));
        expect(screen.getByText(/2x the normal hourly rate/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /See .* public holidays/i }));
        expect(screen.getByText(/Good Friday/i)).toBeInTheDocument();
        expect(screen.getByText(/Freedom Day/i)).toBeInTheDocument();
    });

    it("uses the selected month when validating the minimum wage", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        fireEvent.change(screen.getByLabelText("Payslip month"), { target: { value: "2026-04" } });
        fireEvent.change(screen.getByRole("spinbutton", { name: /Hourly rate/i }), { target: { value: "28.00" } });
        fireEvent.click(screen.getByRole("button", { name: "Continue to this month's work" }));

        await screen.findByRole("heading", { name: /Normal month for April 2026/i });
        expect(legalRegistryMocks.getNMWForDateMock.mock.calls.some(([date]) => date instanceof Date && date.toISOString().startsWith("2026-04-30"))).toBe(true);
    });

    it("keeps the marketing opt-in unchecked on a fresh visit and persists it when selected", async () => {
        await reachStepThree();

        const checkbox = screen.getByRole("checkbox", { name: /send me household employer updates and tips/i });
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
        await screen.findByRole("heading", { name: "Get your first payslip free" });
        fillStepOne();
        await screen.findByRole("heading", { name: /Normal month for/i });
        fillStepTwo();
        await screen.findByRole("heading", { name: "Review and email" });

        expect(screen.getByRole("checkbox", { name: /send me household employer updates and tips/i })).toBeChecked();
    });

    it("shows the combined review summary and success state after a successful send", async () => {
        await reachStepThree();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my first payslip free" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-success")).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(analyticsMocks.trackMock).toHaveBeenCalledWith("free_payslip_started", { source: "public_generator" });
        });
        await waitFor(() => {
            expect(analyticsMocks.trackMock).toHaveBeenCalledWith("free_payslip_sent", { source: "public_generator" });
        });
        expect(screen.getByText("Amount to pay")).toBeInTheDocument();
        expect(screen.getByText("UIF total")).toBeInTheDocument();
        expect(screen.getByTestId("free-payslip-gate-success")).toHaveTextContent("Your free sample was emailed to owner@example.com");
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
        fireEvent.click(screen.getByRole("checkbox", { name: /send me household employer updates and tips/i }));
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my first payslip free" }));

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
                status: "already-used",
                error: "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.",
            }),
        })));

        await reachStepThree();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my first payslip free" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-already-used")).toBeInTheDocument();
        });
        expect(screen.getByText("This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.")).toBeInTheDocument();
        await waitFor(() => {
            expect(analyticsMocks.trackMock).toHaveBeenCalledWith("free_payslip_blocked_already_used", { source: "public_generator" });
        });
        fireEvent.click(screen.getByRole("link", { name: "Start Standard" }));
        expect(analyticsMocks.trackMock).toHaveBeenCalledWith("upgrade_cta_clicked_from_free_limit", { source: "public_generator" });

        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 503,
            ok: false,
            json: async () => ({
                error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
            }),
        })));

        fireEvent.click(screen.getByRole("button", { name: "Email my first payslip free" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-service-unavailable")).toBeInTheDocument();
        });
        expect(screen.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeInTheDocument();
    });
});
