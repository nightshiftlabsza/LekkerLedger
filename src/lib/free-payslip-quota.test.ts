import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ClaimRow = {
    email: string;
    claimed_at: number;
    created_at: number;
    updated_at: number;
};

function createD1Response(results: Array<Record<string, unknown>> = []) {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            success: true,
            result: [{ results }],
        }),
    };
}

describe("free payslip claim helper", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-02T09:00:00.000Z"));
        vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "acct-test");
        vi.stubEnv("CLOUDFLARE_D1_DATABASE_ID", "db-test");
        vi.stubEnv("CLOUDFLARE_D1_API_TOKEN", "token-test");
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("claims exactly one sample per normalized email address", async () => {
        const rows = new Map<string, ClaimRow>();

        vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body ?? "{}")) as { sql?: string; params?: Array<string | number> };
            const sql = body.sql ?? "";
            const params = body.params ?? [];

            if (sql.includes("SELECT email, claimed_at, created_at, updated_at") && sql.includes("FROM free_payslip_claims")) {
                const row = rows.get(String(params[0]));
                return createD1Response(row ? [row] : []);
            }

            if (sql.includes("INSERT INTO free_payslip_claims")) {
                const key = String(params[0]);
                const existing = rows.get(key);
                if (existing) {
                    return createD1Response([]);
                }

                const inserted: ClaimRow = {
                    email: key,
                    claimed_at: Number(params[1]),
                    created_at: Number(params[2]),
                    updated_at: Number(params[3]),
                };
                rows.set(key, inserted);
                return createD1Response([inserted]);
            }

            throw new Error(`Unhandled SQL in test: ${sql}`);
        }));

        const claimModule = await import("./free-payslip-quota");

        expect(await claimModule.getFreePayslipClaimStatus(" Owner@Example.com ")).toMatchObject({
            email: "owner@example.com",
            isClaimed: false,
            claimedAt: null,
        });

        const firstClaim = await claimModule.claimFreePayslipSample(" Owner@Example.com ");
        expect(firstClaim).toMatchObject({
            email: "owner@example.com",
            isClaimed: true,
        });
        expect(typeof firstClaim.claimedAt).toBe("number");

        expect(await claimModule.getFreePayslipClaimStatus("owner@example.com")).toMatchObject({
            email: "owner@example.com",
            isClaimed: true,
        });

        await expect(claimModule.claimFreePayslipSample("owner@example.com")).rejects.toMatchObject({
            status: 409,
            message: "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.",
        });

        const differentEmail = await claimModule.claimFreePayslipSample("second@example.com");
        expect(differentEmail.email).toBe("second@example.com");
        expect(differentEmail.isClaimed).toBe(true);
    });

    it("returns the claimed status when the row already exists", async () => {
        const rows = new Map<string, ClaimRow>([
            ["already@example.com", {
                email: "already@example.com",
                claimed_at: 1700000000000,
                created_at: 1700000000000,
                updated_at: 1700000000000,
            }],
        ]);

        vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body ?? "{}")) as { sql?: string; params?: Array<string | number> };
            const sql = body.sql ?? "";
            const params = body.params ?? [];

            if (sql.includes("SELECT email, claimed_at, created_at, updated_at") && sql.includes("FROM free_payslip_claims")) {
                const row = rows.get(String(params[0]));
                return createD1Response(row ? [row] : []);
            }

            if (sql.includes("INSERT INTO free_payslip_claims")) {
                return createD1Response([]);
            }

            throw new Error(`Unhandled SQL in test: ${sql}`);
        }));

        const claimModule = await import("./free-payslip-quota");

        await expect(claimModule.claimFreePayslipSample("already@example.com")).rejects.toMatchObject({
            status: 409,
            message: "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.",
        });
    });
});
