import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
    updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
    updateSession: (...args: unknown[]) => mocks.updateSessionMock(...args),
}));

import { proxy } from "./proxy";

describe("proxy canonical redirect handling", () => {
    beforeEach(() => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        mocks.updateSessionMock.mockReset();
        mocks.updateSessionMock.mockResolvedValue(NextResponse.next());
    });

    it("redirects a legacy help url and www host in one hop", async () => {
        const response = await proxy(new NextRequest("http://www.lekkerledger.co.za/help/compliance?x=1"));

        expect(response.status).toBe(308);
        expect(response.headers.get("location")).toBe("https://lekkerledger.co.za/resources/checklists?x=1");
        expect(mocks.updateSessionMock).not.toHaveBeenCalled();
    });

    it("redirects www traffic to the canonical bare domain while preserving path and query", async () => {
        const response = await proxy(new NextRequest("https://www.lekkerledger.co.za/some-public-page?x=1"));

        expect(response.status).toBe(308);
        expect(response.headers.get("location")).toBe("https://lekkerledger.co.za/some-public-page?x=1");
        expect(mocks.updateSessionMock).not.toHaveBeenCalled();
    });

    it("passes canonical public traffic through to the auth/session middleware", async () => {
        const request = new NextRequest("https://lekkerledger.co.za/resources/checklists");
        const response = await proxy(request);

        expect(mocks.updateSessionMock).toHaveBeenCalledWith(request);
        expect(response.status).toBe(200);
    });
});
