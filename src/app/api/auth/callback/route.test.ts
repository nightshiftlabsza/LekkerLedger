import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    exchangeCodeForSessionMock: vi.fn(),
}));

vi.mock("@/lib/app-origin", () => ({
    getRequestAppOrigin: () => "https://lekkerledger.co.za",
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: {
            exchangeCodeForSession: mocks.exchangeCodeForSessionMock,
        },
    }),
}));

import { GET } from "./route";

describe("free payslip auth callback", () => {
    beforeEach(() => {
        mocks.exchangeCodeForSessionMock.mockReset();
        vi.unstubAllEnvs();
    });

    it("redirects a successful public tool callback back to the tool", async () => {
        mocks.exchangeCodeForSessionMock.mockResolvedValue({ error: null });

        const response = await GET(new Request(
            "https://lekkerledger.co.za/api/auth/callback?code=abc123&next=%2Fresources%2Ftools%2Fdomestic-worker-payslip%3FfreePayslipVerification%3Dsuccess",
        ));

        expect(response.headers.get("location")).toBe(
            "https://lekkerledger.co.za/resources/tools/domestic-worker-payslip?freePayslipVerification=success",
        );
    });

    it("returns the public tool to an invalid-link state when the code is expired", async () => {
        mocks.exchangeCodeForSessionMock.mockResolvedValue({
            error: { message: "Invalid or expired code" },
        });

        const response = await GET(new Request(
            "https://lekkerledger.co.za/api/auth/callback?code=bad-code&next=%2Fresources%2Ftools%2Fdomestic-worker-payslip%3FfreePayslipVerification%3Dsuccess",
        ));

        expect(response.headers.get("location")).toBe(
            "https://lekkerledger.co.za/resources/tools/domestic-worker-payslip?freePayslipVerification=invalid-link",
        );
    });

    it("returns the public tool to a missing-session state for other exchange failures", async () => {
        mocks.exchangeCodeForSessionMock.mockResolvedValue({
            error: { message: "Something else went wrong" },
        });

        const response = await GET(new Request(
            "https://lekkerledger.co.za/api/auth/callback?code=bad-code&next=%2Fresources%2Ftools%2Fdomestic-worker-payslip%3FfreePayslipVerification%3Dsuccess",
        ));

        expect(response.headers.get("location")).toBe(
            "https://lekkerledger.co.za/resources/tools/domestic-worker-payslip?freePayslipVerification=missing-session",
        );
    });

    it("keeps the existing login redirect for non-tool routes", async () => {
        mocks.exchangeCodeForSessionMock.mockResolvedValue({
            error: { message: "Invalid or expired code" },
        });

        const response = await GET(new Request(
            "https://lekkerledger.co.za/api/auth/callback?code=bad-code&next=%2Fdashboard",
        ));

        expect(response.headers.get("location")).toBe(
            "https://lekkerledger.co.za/login?error=invalid_or_expired_link",
        );
    });

    it("supports the e2e email bridge for the public tool", async () => {
        vi.stubEnv("E2E_BYPASS_AUTH", "1");

        const response = await GET(new Request(
            "https://lekkerledger.co.za/api/auth/callback?e2eFreePayslipEmail=tester%40example.com&next=%2Fresources%2Ftools%2Fdomestic-worker-payslip%3FfreePayslipVerification%3Dsuccess",
        ));

        expect(response.headers.get("location")).toBe(
            "https://lekkerledger.co.za/resources/tools/domestic-worker-payslip?freePayslipVerification=success",
        );
        expect(response.headers.get("set-cookie")).toContain("ll-e2e-free-payslip-email=tester%40example.com");
    });
});
