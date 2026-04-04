import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FreePayslipGenerator } from "./free-payslip-generator";

describe("FreePayslipGenerator", () => {
    function fillRequiredFields() {
        fireEvent.change(screen.getByLabelText("Employer name"), { target: { value: "Nomsa Dlamini" } });
        fireEvent.change(screen.getByLabelText("Employer address"), { target: { value: "18 Acacia Avenue" } });
        fireEvent.change(screen.getByLabelText("Worker name"), { target: { value: "Thandi Maseko" } });
        const ordinaryDaysInput = document.getElementById("free-ordinary-days");
        if (!ordinaryDaysInput) {
            throw new Error("Normal days input not found");
        }
        fireEvent.change(ordinaryDaysInput, { target: { value: "19" } });
    }

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

    it("keeps the simplified layout and removes same-browser wording", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter this month's pay details" });
        expect(screen.queryByText("Build the payslip step by step.")).toBeNull();
        expect(screen.queryByText(/same browser/i)).toBeNull();
        expect(screen.queryByRole("button", { name: "I opened the email link" })).toBeNull();
        expect(screen.getByRole("button", { name: "Email my free payslip" })).toBeInTheDocument();
    });

    it("keeps secondary fields hidden by default", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter this month's pay details" });
        expect(screen.queryByLabelText("Job title")).toBeNull();
        expect(screen.queryByLabelText("ID or passport number")).toBeNull();
        expect(screen.queryByLabelText("Other deductions")).toBeNull();
    });

    it("shows a success state after a successful email send", async () => {
        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter this month's pay details" });
        fillRequiredFields();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-success")).toBeInTheDocument();
        });
        expect(screen.getByText("Your payslip has been sent to owner@example.com")).toBeInTheDocument();
    });

    it("shows the monthly limit state cleanly", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 409,
            ok: false,
            json: async () => ({
                error: "This verified email has already used its one successful free payslip PDF for this calendar month.",
            }),
        })));

        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter this month's pay details" });
        fillRequiredFields();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-quota-used")).toBeInTheDocument();
        });
        expect(screen.getByText("This verified email has already used its one successful free payslip PDF for this calendar month.")).toBeInTheDocument();
    });

    it("shows the service-unavailable state cleanly", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({
            status: 503,
            ok: false,
            json: async () => ({
                error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
            }),
        })));

        render(<FreePayslipGenerator />);

        await screen.findByRole("heading", { name: "Enter this month's pay details" });
        fillRequiredFields();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "owner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Email my free payslip" }));

        await waitFor(() => {
            expect(screen.getByTestId("free-payslip-gate-service-unavailable")).toBeInTheDocument();
        });
        expect(screen.getByText("The free payslip service is temporarily unavailable. Please try again in a moment.")).toBeInTheDocument();
    });
});
