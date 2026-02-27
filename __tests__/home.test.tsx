import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "@/app/page";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe("Home page", () => {
    it("renders without crashing", () => {
        render(<Page />);
        expect(document.body).toBeTruthy();
    });
});
