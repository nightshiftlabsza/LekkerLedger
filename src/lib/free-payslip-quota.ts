type QueryParam = string | number | null;

interface D1ApiEnvelope {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: unknown;
}

interface FreePayslipQuotaRow {
    email: string;
    monthKey: string;
    downloadsUsed: number;
    verifiedAt: number;
    createdAt: number;
    updatedAt: number;
}

export interface FreePayslipQuotaStatus {
    email: string;
    monthKey: string;
    downloadsUsed: number;
    remainingDownloads: number;
    usedThisMonth: boolean;
}

class FreePayslipQuotaError extends Error {
    status: number;

    constructor(message: string, status = 500) {
        super(message);
        this.status = status;
    }
}

let schemaPromise: Promise<void> | null = null;

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value || value === "undefined" || value === "null") {
        throw new FreePayslipQuotaError(`${name} is missing.`, 503);
    }
    return value;
}

function getD1Config() {
    return {
        accountId: getRequiredEnv("CLOUDFLARE_ACCOUNT_ID"),
        databaseId: getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID"),
        apiToken: getRequiredEnv("CLOUDFLARE_D1_API_TOKEN"),
    };
}

function extractD1Rows(payload: D1ApiEnvelope): Array<Record<string, unknown>> {
    const result = payload.result;

    if (Array.isArray(result)) {
        const [first] = result;
        if (first && typeof first === "object" && Array.isArray((first as Record<string, unknown>).results)) {
            return ((first as Record<string, unknown>).results as Array<Record<string, unknown>>) || [];
        }
    }

    if (result && typeof result === "object" && Array.isArray((result as Record<string, unknown>).results)) {
        return (result as Record<string, unknown>).results as Array<Record<string, unknown>>;
    }

    return [];
}

async function queryD1(sql: string, params: QueryParam[] = []): Promise<Array<Record<string, unknown>>> {
    const { accountId, databaseId, apiToken } = getD1Config();
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ sql, params }),
        cache: "no-store",
    });

    const payload = await response.json() as D1ApiEnvelope;
    if (!response.ok || payload.success === false) {
        throw new FreePayslipQuotaError(payload.errors?.[0]?.message || "Cloudflare D1 query failed.", 502);
    }

    return extractD1Rows(payload);
}

function toMonthKey(date = new Date()): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value ?? "0000";
    const month = parts.find((part) => part.type === "month")?.value ?? "00";
    return `${year}-${month}`;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function rowToQuota(row: Record<string, unknown>): FreePayslipQuotaRow {
    return {
        email: String(row.email || ""),
        monthKey: String(row.month_key || ""),
        downloadsUsed: Number(row.downloads_used || 0),
        verifiedAt: Number(row.verified_at || 0),
        createdAt: Number(row.created_at || 0),
        updatedAt: Number(row.updated_at || 0),
    };
}

async function ensureSchema() {
    if (schemaPromise === null) {
        schemaPromise = (async () => {
            await queryD1(`
                CREATE TABLE IF NOT EXISTS free_payslip_quota (
                    email TEXT NOT NULL,
                    month_key TEXT NOT NULL,
                    downloads_used INTEGER NOT NULL DEFAULT 0,
                    verified_at INTEGER NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    PRIMARY KEY (email, month_key)
                )
            `);
        })();
    }

    await schemaPromise;
}

async function getQuotaRow(email: string, monthKey: string): Promise<FreePayslipQuotaRow | null> {
    await ensureSchema();
    const rows = await queryD1(
        "SELECT * FROM free_payslip_quota WHERE email = ? AND month_key = ? LIMIT 1",
        [normalizeEmail(email), monthKey],
    );
    return rows[0] ? rowToQuota(rows[0]) : null;
}

export async function getFreePayslipQuotaStatus(email: string): Promise<FreePayslipQuotaStatus> {
    const normalizedEmail = normalizeEmail(email);
    const monthKey = toMonthKey();
    const row = await getQuotaRow(normalizedEmail, monthKey);
    const downloadsUsed = row?.downloadsUsed ?? 0;

    return {
        email: normalizedEmail,
        monthKey,
        downloadsUsed,
        remainingDownloads: Math.max(0, 1 - downloadsUsed),
        usedThisMonth: downloadsUsed >= 1,
    };
}

export async function consumeFreePayslipQuota(email: string): Promise<FreePayslipQuotaStatus> {
    const normalizedEmail = normalizeEmail(email);
    const monthKey = toMonthKey();
    const existing = await getQuotaRow(normalizedEmail, monthKey);

    if ((existing?.downloadsUsed ?? 0) >= 1) {
        throw new FreePayslipQuotaError("This verified email has already downloaded a free payslip this month.", 409);
    }

    const now = Date.now();
    await ensureSchema();
    await queryD1(
        `
            INSERT INTO free_payslip_quota (
                email,
                month_key,
                downloads_used,
                verified_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(email, month_key) DO UPDATE SET
                downloads_used = excluded.downloads_used,
                verified_at = excluded.verified_at,
                updated_at = excluded.updated_at
        `,
        [normalizedEmail, monthKey, 1, now, existing?.createdAt ?? now, now],
    );

    return getFreePayslipQuotaStatus(normalizedEmail);
}

export function toFreePayslipQuotaErrorResponse(error: unknown) {
    if (error instanceof FreePayslipQuotaError) {
        return { status: error.status, message: error.message };
    }

    return { status: 500, message: "The free payslip limit could not be checked." };
}
