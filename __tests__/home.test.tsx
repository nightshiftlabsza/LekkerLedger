import { render, act, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "@/app/(marketing)/page";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("Home page", () => {
    it("renders the calmer homepage flow", async () => {
        await act(async () => {
            render(<Page />);
        });
        expect(screen.getByRole("heading", { name: /one calm place to run household payroll/i })).toBeTruthy();
        expect(screen.getAllByRole("link", { name: /start free/i }).length).toBeGreaterThan(0);
        expect(screen.getByRole("heading", { name: /a shorter path from monthly payroll to annual paperwork/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /enough pricing to choose a direction/i })).toBeTruthy();
        expect(screen.getByRole("heading", { name: /short answers to the main signup questions/i })).toBeTruthy();
    });
});

