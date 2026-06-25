import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    resetPasswordForEmailMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: {
            resetPasswordForEmail: (...args: unknown[]) => mocks.resetPasswordForEmailMock(...args),
        },
    }),
}));

import { POST } from "./route";

function buildRequest(body: unknown = { email: "Person@Example.com" }) {
    return new Request("https://lekkerledger.co.za/api/auth/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-host": "www.lekkerledger.co.za",
            "x-forwarded-proto": "https",
        },
        body: JSON.stringify(body),
    });
}

describe("password reset route", () => {
    beforeEach(() => {
        mocks.resetPasswordForEmailMock.mockReset();
        mocks.resetPasswordForEmailMock.mockResolvedValue({ error: null });
    });

    it("sends the reset email through Supabase from the server", async () => {
        const response = await POST(buildRequest());

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ ok: true });
        expect(mocks.resetPasswordForEmailMock).toHaveBeenCalledWith("person@example.com", {
            redirectTo: "https://lekkerledger.co.za/api/auth/callback?next=%2Freset-password",
        });
    });

    it("rejects invalid email addresses before calling Supabase", async () => {
        const response = await POST(buildRequest({ email: "not-an-email" }));

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: "Enter a valid email address." });
        expect(mocks.resetPasswordForEmailMock).not.toHaveBeenCalled();
    });

    it("returns a friendly rate-limit message", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        mocks.resetPasswordForEmailMock.mockResolvedValue({
            error: { message: "You can only request this once every 60 seconds" },
        });

        const response = await POST(buildRequest());

        expect(response.status).toBe(429);
        await expect(response.json()).resolves.toEqual({
            error: "Too many reset attempts. Please wait a moment before trying again.",
        });
    });
});
