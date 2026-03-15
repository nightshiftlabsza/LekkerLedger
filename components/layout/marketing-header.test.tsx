import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthStateProvider } from "@/components/auth/auth-state-provider";
import { MarketingHeader } from "./marketing-header";

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: {
                        id: "user-1",
                        email: "paid.user@example.com",
                    },
                },
            }),
            onAuthStateChange: () => ({
                data: {
                    subscription: {
                        unsubscribe: vi.fn(),
                    },
                },
            }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
    }),
}));

vi.mock("next/navigation", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next/navigation")>();

    return {
        ...actual,
        useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
        usePathname: () => "/",
    };
});

describe("MarketingHeader", () => {
    it("shows an account menu instead of the login CTA when a session is present", () => {
        render(
            <AuthStateProvider initialUser={{ id: "user-1", email: "paid.user@example.com" }}>
                <MarketingHeader />
            </AuthStateProvider>,
        );

        expect(screen.getByText("paid.user@example.com")).toBeTruthy();
        expect(screen.queryByText("Log in")).toBeNull();
        expect(screen.getByRole("button", { name: /open account menu/i })).toBeTruthy();
    });

    it("shows a single login action when logged out", () => {
        render(<MarketingHeader />);

        expect(screen.getAllByText("Log in").length).toBeGreaterThan(0);
        expect(screen.queryByText("Start free")).toBeNull();
    });
});
