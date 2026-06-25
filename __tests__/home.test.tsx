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
        expect(screen.getByRole("heading", { name: /domestic worker payslips and uif for south african households/i })).toBeTruthy();
        expect(screen.getAllByRole("link", { name: /get your first payslip free/i })[0]).toBeTruthy();
        expect(screen.getByRole("link", { name: /check uif and take-home pay/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /^payslip$/i })).toBeTruthy();
        expect(screen.queryByText(/live preview/i)).toBeNull();
        expect(screen.queryByText(/the homepage now shows the flow once/i)).toBeNull();
        expect(screen.getByRole("heading", { name: /what paid plans add after the first payslip/i })).toBeTruthy();
        expect(screen.getByText(/before you pay/i)).toBeTruthy();
        expect(screen.getByText(/why this exists/i)).toBeTruthy();
        expect(screen.getByRole("heading", { name: /questions households ask before they start/i })).toBeTruthy();
    });
});

