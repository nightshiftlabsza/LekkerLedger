import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getUserMock: vi.fn(),
    getStatusMock: vi.fn(),
    consumeQuotaMock: vi.fn(),
    errorResponseMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: {
            getUser: mocks.getUserMock,
        },
    }),
}));

vi.mock("@/lib/free-payslip-quota", () => ({
    getFreePayslipQuotaStatus: (...args: unknown[]) => mocks.getStatusMock(...args),
    consumeFreePayslipQuota: (...args: unknown[]) => mocks.consumeQuotaMock(...args),
    toFreePayslipQuotaErrorResponse: (...args: unknown[]) => mocks.errorResponseMock(...args),
}));

import { GET, POST } from "./route";

describe("free payslip quota route", () => {
    beforeEach(() => {
        mocks.getUserMock.mockReset();
        mocks.getStatusMock.mockReset();
        mocks.consumeQuotaMock.mockReset();
        mocks.errorResponseMock.mockReset();
        vi.unstubAllEnvs();
    });

    it("returns quota status for a verified user", async () => {
        mocks.getUserMock.mockResolvedValue({
            data: { user: { email: "worker@example.com" } },
            error: null,
        });
        mocks.getStatusMock.mockResolvedValue({
            email: "worker@example.com",
            monthKey: "2026-03",
            downloadsUsed: 0,
            remainingDownloads: 1,
            usedThisMonth: false,
        });

        const response = await GET(new Request("https://lekkerledger.co.za/api/free-payslip/quota"));
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            email: "worker@example.com",
            usedThisMonth: false,
        });
    });

    it("returns 401 when no verified email exists", async () => {
        mocks.getUserMock.mockResolvedValue({
            data: { user: null },
            error: { message: "No session" },
        });

        const response = await GET(new Request("https://lekkerledger.co.za/api/free-payslip/quota"));
        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toMatchObject({
            error: "Email verification is required before downloading the free payslip.",
        });
    });

    it("returns a service status when quota lookup fails for infra reasons", async () => {
        mocks.getUserMock.mockResolvedValue({
            data: { user: { email: "worker@example.com" } },
            error: null,
        });
        mocks.getStatusMock.mockRejectedValue(new Error("d1 timeout"));
        mocks.errorResponseMock.mockReturnValue({
            status: 503,
            message: "The free payslip service is temporarily unavailable. Please try again in a moment.",
        });

        const response = await GET(new Request("https://lekkerledger.co.za/api/free-payslip/quota"));

        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toMatchObject({
            error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
        });
    });

    it("returns 409 when the monthly quota has already been used", async () => {
        mocks.getUserMock.mockResolvedValue({
            data: { user: { email: "worker@example.com" } },
            error: null,
        });
        mocks.consumeQuotaMock.mockRejectedValue(new Error("already used"));
        mocks.errorResponseMock.mockReturnValue({
            status: 409,
            message: "This verified email has already used its one successful free payslip PDF for this calendar month.",
        });

        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/quota", { method: "POST" }));
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toMatchObject({
            error: "This verified email has already used its one successful free payslip PDF for this calendar month.",
        });
    });

    it("accepts the e2e verified-email cookie bridge", async () => {
        vi.stubEnv("E2E_BYPASS_AUTH", "1");
        mocks.getStatusMock.mockResolvedValue({
            email: "tester@example.com",
            monthKey: "2026-03",
            downloadsUsed: 0,
            remainingDownloads: 1,
            usedThisMonth: false,
        });

        const response = await GET(new Request("https://lekkerledger.co.za/api/free-payslip/quota", {
            headers: {
                cookie: "ll-e2e-free-payslip-email=tester%40example.com",
            },
        }));

        expect(response.status).toBe(200);
        expect(mocks.getUserMock).not.toHaveBeenCalled();
        await expect(response.json()).resolves.toMatchObject({
            email: "tester@example.com",
        });
    });
});
