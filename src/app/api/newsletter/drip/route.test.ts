import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getDueMock: vi.fn(),
    markSentMock: vi.fn(),
    sendDripMock: vi.fn(),
    envValues: { NEWSLETTER_DRIP_SECRET: "test-drip-secret" } as Record<string, string | undefined>,
}));

vi.mock("@/lib/newsletter", () => ({
    getSubscribersDueForDrip: (...args: unknown[]) => mocks.getDueMock(...args),
    markDripSent: (...args: unknown[]) => mocks.markSentMock(...args),
}));

vi.mock("@/lib/newsletter-emails", () => ({
    sendDripEmail: (...args: unknown[]) => mocks.sendDripMock(...args),
}));

vi.mock("@/lib/env", () => ({
    env: new Proxy({}, {
        get(_target, prop: string) {
            return mocks.envValues[prop];
        },
    }),
}));

import { POST } from "./route";

function buildRequest(secret?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (secret) {
        headers.Authorization = `Bearer ${secret}`;
    }
    return new Request("https://lekkerledger.co.za/api/newsletter/drip", {
        method: "POST",
        headers,
    });
}

describe("newsletter drip route", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.getDueMock.mockReset();
        mocks.markSentMock.mockReset();
        mocks.sendDripMock.mockReset();
        mocks.envValues = { NEWSLETTER_DRIP_SECRET: "test-drip-secret" };
        mocks.getDueMock.mockResolvedValue([]);
        mocks.markSentMock.mockResolvedValue(undefined);
        mocks.sendDripMock.mockResolvedValue(undefined);
    });

    it("returns 401 without an authorization header", async () => {
        const response = await POST(buildRequest());
        expect(response.status).toBe(401);
    });

    it("returns 401 with the wrong secret", async () => {
        const response = await POST(buildRequest("wrong-secret"));
        expect(response.status).toBe(401);
    });

    it("returns 401 when NEWSLETTER_DRIP_SECRET is not set", async () => {
        mocks.envValues = { NEWSLETTER_DRIP_SECRET: undefined };
        const response = await POST(buildRequest("test-drip-secret"));
        expect(response.status).toBe(401);
    });

    it("processes all three drip levels and returns counts", async () => {
        mocks.getDueMock
            .mockResolvedValueOnce([{ email: "a@b.com", subscribed_at: 1000 }])
            .mockResolvedValueOnce([{ email: "c@d.com", subscribed_at: 2000 }])
            .mockResolvedValueOnce([]);

        const response = await POST(buildRequest("test-drip-secret"));
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body.sent).toBe(2);
        expect(body.failed).toBe(0);
        expect(body.errors).toEqual([]);

        expect(mocks.sendDripMock).toHaveBeenCalledWith("a@b.com", 1);
        expect(mocks.markSentMock).toHaveBeenCalledWith("a@b.com", 1);
        expect(mocks.sendDripMock).toHaveBeenCalledWith("c@d.com", 2);
        expect(mocks.markSentMock).toHaveBeenCalledWith("c@d.com", 2);
    });

    it("continues processing after an individual send failure", async () => {
        mocks.getDueMock
            .mockResolvedValueOnce([
                { email: "fail@b.com", subscribed_at: 1000 },
                { email: "pass@b.com", subscribed_at: 2000 },
            ])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        mocks.sendDripMock
            .mockRejectedValueOnce(new Error("send failed"))
            .mockResolvedValueOnce(undefined);

        vi.spyOn(console, "error").mockImplementation(() => undefined);

        const response = await POST(buildRequest("test-drip-secret"));
        const body = await response.json();

        expect(body.sent).toBe(1);
        expect(body.failed).toBe(1);
        expect(body.errors).toEqual(["drip_1:fail@b.com"]);
    });

    it("returns empty results when no subscribers are due", async () => {
        const response = await POST(buildRequest("test-drip-secret"));
        const body = await response.json();

        expect(body.sent).toBe(0);
        expect(body.failed).toBe(0);
        expect(mocks.sendDripMock).not.toHaveBeenCalled();
    });
});
