import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type QuotaRow = {
    email: string;
    month_key: string;
    downloads_used: number;
    verified_at: number;
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

describe("free payslip quota helper", () => {
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

    it("enforces one successful free payslip PDF per verified email per calendar month", async () => {
        const rows = new Map<string, QuotaRow>();

        vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body ?? "{}")) as { sql?: string; params?: Array<string | number> };
            const sql = body.sql ?? "";
            const params = body.params ?? [];

            if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
                return createD1Response();
            }

            if (sql.includes("SELECT * FROM free_payslip_quota")) {
                const key = `${params[0]}::${params[1]}`;
                const row = rows.get(key);
                return createD1Response(row ? [row] : []);
            }

            if (sql.includes("INSERT INTO free_payslip_quota")) {
                const key = `${params[0]}::${params[1]}`;
                if (!rows.has(key)) {
                    rows.set(key, {
                        email: String(params[0]),
                        month_key: String(params[1]),
                        downloads_used: Number(params[2]),
                        verified_at: Number(params[3]),
                        created_at: Number(params[4]),
                        updated_at: Number(params[5]),
                    });
                }
                return createD1Response();
            }

            if (sql.includes("UPDATE free_payslip_quota") && sql.includes("RETURNING")) {
                const key = `${params[2]}::${params[3]}`;
                const row = rows.get(key);
                if (!row || row.downloads_used !== 0) {
                    return createD1Response([]);
                }

                const updated: QuotaRow = {
                    ...row,
                    downloads_used: 1,
                    verified_at: Number(params[0]),
                    updated_at: Number(params[1]),
                };
                rows.set(key, updated);
                return createD1Response([updated]);
            }

            if (sql.includes("UPDATE free_payslip_quota SET updated_at")) {
                const key = `${params[1]}::${params[2]}`;
                const row = rows.get(key);
                if (row) {
                    rows.set(key, { ...row, updated_at: Number(params[0]) });
                }
                return createD1Response();
            }

            throw new Error(`Unhandled SQL in test: ${sql}`);
        }));

        const quotaModule = await import("./free-payslip-quota");

        const firstStatus = await quotaModule.consumeFreePayslipQuota("Owner@example.com");
        expect(firstStatus.email).toBe("owner@example.com");
        expect(firstStatus.downloadsUsed).toBe(1);
        expect(firstStatus.remainingDownloads).toBe(0);
        expect(firstStatus.usedThisMonth).toBe(true);

        await expect(quotaModule.consumeFreePayslipQuota("owner@example.com")).rejects.toMatchObject({
            status: 409,
            message: "This verified email has already used its one successful free payslip PDF for this calendar month.",
        });

        const differentEmail = await quotaModule.consumeFreePayslipQuota("second@example.com");
        expect(differentEmail.downloadsUsed).toBe(1);
    });

    it("allows the same verified email again in a new Johannesburg calendar month", async () => {
        const rows = new Map<string, QuotaRow>();

        vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body ?? "{}")) as { sql?: string; params?: Array<string | number> };
            const sql = body.sql ?? "";
            const params = body.params ?? [];

            if (sql.includes("CREATE TABLE IF NOT EXISTS")) return createD1Response();
            if (sql.includes("SELECT * FROM free_payslip_quota")) {
                const row = rows.get(`${params[0]}::${params[1]}`);
                return createD1Response(row ? [row] : []);
            }
            if (sql.includes("INSERT INTO free_payslip_quota")) {
                const key = `${params[0]}::${params[1]}`;
                if (!rows.has(key)) {
                    rows.set(key, {
                        email: String(params[0]),
                        month_key: String(params[1]),
                        downloads_used: Number(params[2]),
                        verified_at: Number(params[3]),
                        created_at: Number(params[4]),
                        updated_at: Number(params[5]),
                    });
                }
                return createD1Response();
            }
            if (sql.includes("UPDATE free_payslip_quota") && sql.includes("RETURNING")) {
                const key = `${params[2]}::${params[3]}`;
                const row = rows.get(key);
                if (!row || row.downloads_used !== 0) return createD1Response([]);
                const updated = { ...row, downloads_used: 1, verified_at: Number(params[0]), updated_at: Number(params[1]) };
                rows.set(key, updated);
                return createD1Response([updated]);
            }
            if (sql.includes("UPDATE free_payslip_quota SET updated_at")) return createD1Response();

            throw new Error(`Unhandled SQL in test: ${sql}`);
        }));

        const quotaModule = await import("./free-payslip-quota");

        const april = await quotaModule.consumeFreePayslipQuota("owner@example.com");
        vi.setSystemTime(new Date("2026-05-02T09:00:00.000Z"));
        const may = await quotaModule.consumeFreePayslipQuota("owner@example.com");

        expect(april.monthKey).not.toBe(may.monthKey);
        expect(may.downloadsUsed).toBe(1);
    });
});
