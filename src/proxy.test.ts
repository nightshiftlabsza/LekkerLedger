import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
    updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
    updateSession: (...args: unknown[]) => mocks.updateSessionMock(...args),
}));

import { proxy } from "./proxy";

describe("proxy canonical host handling", () => {
    beforeEach(() => {
        mocks.updateSessionMock.mockReset();
        mocks.updateSessionMock.mockResolvedValue(NextResponse.next());
    });

    it("redirects www traffic to the canonical bare domain", async () => {
        const response = await proxy(new NextRequest("https://www.lekkerledger.co.za/dashboard?paidLogin=1"));

        expect(response.status).toBe(308);
        expect(response.headers.get("location")).toBe("https://lekkerledger.co.za/dashboard?paidLogin=1");
        expect(mocks.updateSessionMock).not.toHaveBeenCalled();
    });

    it("passes canonical host traffic through to the auth/session middleware", async () => {
        const request = new NextRequest("https://lekkerledger.co.za/dashboard");
        const response = await proxy(request);

        expect(mocks.updateSessionMock).toHaveBeenCalledWith(request);
        expect(response.status).toBe(200);
    });
});
