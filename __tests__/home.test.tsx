import { render, act, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "@/app/(marketing)/page";

vi.mock("next/navigation", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next/navigation")>();

    return {
        ...actual,
        useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
        usePathname: () => "/",
    };
});

describe("Home page", () => {
    it("renders the rebuilt homepage flow", async () => {
        await act(async () => {
            render(<Page />);
        });
        expect(screen.getByRole("heading", { name: /payslips and household employment records in one place/i })).toBeTruthy();
        expect(screen.getByRole("link", { name: /generate free payslip/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /^payslip$/i })).toBeTruthy();
        expect(screen.queryByText(/live preview/i)).toBeNull();
        expect(screen.queryByText(/the homepage now shows the flow once/i)).toBeNull();
        expect(screen.getByRole("heading", { name: /set up once\. generate payslips\. keep the records together/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /pick the plan that fits your household/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /questions households ask before they start/i })).toBeTruthy();
    });
});

