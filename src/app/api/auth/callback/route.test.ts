import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    exchangeCodeForSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: {
            exchangeCodeForSession: (...args: unknown[]) => mocks.exchangeCodeForSessionMock(...args),
        },
    }),
}));

import { GET } from "./route";

function buildRequest(query: string) {
    return new Request(`https://lekkerledger.co.za/api/auth/callback${query}`, {
        headers: {
            "x-forwarded-host": "www.lekkerledger.co.za",
            "x-forwarded-proto": "https",
        },
    });
}

describe("auth callback route", () => {
    beforeEach(() => {
        mocks.exchangeCodeForSessionMock.mockReset();
        mocks.exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    });

    it("exchanges a valid code and keeps the internal next path", async () => {
        const response = await GET(buildRequest("?code=valid-code&next=%2Freset-password"));

        expect(mocks.exchangeCodeForSessionMock).toHaveBeenCalledWith("valid-code");
        expect(response.headers.get("location")).toBe("https://lekkerledger.co.za/reset-password");
    });

    it("rejects an external or protocol-relative next URL", async () => {
        const response = await GET(buildRequest("?code=valid-code&next=https%3A%2F%2Fevil.example%2Fsteal"));

        expect(response.headers.get("location")).toBe("https://lekkerledger.co.za/dashboard");
    });

    it("shows the same safe error for missing and failed codes", async () => {
        const missingCodeResponse = await GET(buildRequest(""));
        expect(missingCodeResponse.headers.get("location")).toBe("https://lekkerledger.co.za/login?error=invalid_or_expired_link");

        mocks.exchangeCodeForSessionMock.mockResolvedValue({ error: { message: "Invalid code" } });
        const failedResponse = await GET(buildRequest("?code=expired-code"));
        expect(failedResponse.headers.get("location")).toBe("https://lekkerledger.co.za/login?error=invalid_or_expired_link");
    });
});
