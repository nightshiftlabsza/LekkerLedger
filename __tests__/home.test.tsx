import { render, act, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "@/app/(marketing)/page";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("Home page", () => {
    it("renders the rebuilt homepage flow", async () => {
        await act(async () => {
            render(<Page />);
        });
        expect(screen.getByRole("heading", { name: /household payroll records without the cost and complexity of business payroll software/i })).toBeTruthy();
        expect(screen.getAllByRole("link", { name: /start free/i }).length).toBeGreaterThan(0);
        expect(screen.getByText(/sample payslip/i)).toBeTruthy();
        expect(screen.queryByText(/live preview/i)).toBeNull();
        expect(screen.queryByText(/the homepage now shows the flow once/i)).toBeNull();
        expect(screen.getByRole("heading", { name: /keep the month clear, then keep the records ready/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /pick the plan that fits your household/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /questions households ask before they start/i })).toBeTruthy();
    });
});


