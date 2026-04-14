type QueryParam = string | number | null;
const D1_QUERY_TIMEOUT_MS = 8_000;
const D1_MAX_ATTEMPTS = 2;
const FREE_PAYSLIP_CLAIMS_TABLE = "free_payslip_claims";

interface D1ApiEnvelope {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: unknown;
}

interface FreePayslipClaimRow {
    email: string;
    claimedAt: number;
    createdAt: number;
    updatedAt: number;
}

export interface FreePayslipClaimStatus {
    email: string;
    isClaimed: boolean;
    claimedAt: number | null;
}

export const FREE_PAYSLIP_ALREADY_USED_MESSAGE = "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.";

class FreePayslipClaimError extends Error {
    status: number;
    retryable: boolean;

    constructor(message: string, status = 500, retryable = false) {
        super(message);
        this.status = status;
        this.retryable = retryable;
    }
}

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value || value === "undefined" || value === "null") {
        throw new FreePayslipClaimError(`${name} is missing.`, 503);
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

function isRetryableQuotaError(error: unknown) {
    return error instanceof FreePayslipClaimError && error.retryable;
}

async function queryD1Once(sql: string, params: QueryParam[] = []): Promise<Array<Record<string, unknown>>> {
    const { accountId, databaseId, apiToken } = getD1Config();
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), D1_QUERY_TIMEOUT_MS);

    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({ sql, params }),
            cache: "no-store",
            signal: controller.signal,
        });

        const payload = await response.json() as D1ApiEnvelope;
        if (!response.ok || payload.success === false) {
            const status = response.status >= 500 ? 502 : response.status;
            throw new FreePayslipClaimError(
                payload.errors?.[0]?.message || "Cloudflare D1 query failed.",
                status,
                response.status >= 500,
            );
        }

        return extractD1Rows(payload);
    } catch (error) {
        if (error instanceof FreePayslipClaimError) {
            throw error;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
            throw new FreePayslipClaimError("The free payslip service took too long to respond.", 503, true);
        }

        throw new FreePayslipClaimError("The free payslip service could not be reached.", 503, true);
    } finally {
        globalThis.clearTimeout(timeoutId);
    }
}

async function queryD1(sql: string, params: QueryParam[] = []): Promise<Array<Record<string, unknown>>> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= D1_MAX_ATTEMPTS; attempt += 1) {
        try {
            return await queryD1Once(sql, params);
        } catch (error) {
            lastError = error;
            if (!isRetryableQuotaError(error) || attempt === D1_MAX_ATTEMPTS) {
                throw error;
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new FreePayslipClaimError("The free payslip service could not be reached.", 503, false);
}

export function normalizeFreePayslipEmail(email: string): string {
    return email.trim().toLowerCase();
}

function rowToClaim(row: Record<string, unknown>): FreePayslipClaimRow {
    return {
        email: typeof row.email === "string" ? row.email : "",
        claimedAt: Number(row.claimed_at || 0),
        createdAt: Number(row.created_at || 0),
        updatedAt: Number(row.updated_at || 0),
    };
}

function rowToClaimStatus(row: FreePayslipClaimRow): FreePayslipClaimStatus {
    return {
        email: row.email,
        isClaimed: true,
        claimedAt: row.claimedAt,
    };
}

async function getClaimRow(email: string): Promise<FreePayslipClaimRow | null> {
    const rows = await queryD1(
        `SELECT email, claimed_at, created_at, updated_at
         FROM ${FREE_PAYSLIP_CLAIMS_TABLE}
         WHERE email = ?
         LIMIT 1`,
        [normalizeFreePayslipEmail(email)],
    );
    return rows[0] ? rowToClaim(rows[0]) : null;
}

export async function getFreePayslipClaimStatus(email: string): Promise<FreePayslipClaimStatus> {
    const normalizedEmail = normalizeFreePayslipEmail(email);
    const row = await getClaimRow(normalizedEmail);

    return {
        email: normalizedEmail,
        isClaimed: Boolean(row),
        claimedAt: row?.claimedAt ?? null,
    };
}

export async function claimFreePayslipSample(email: string): Promise<FreePayslipClaimStatus> {
    const normalizedEmail = normalizeFreePayslipEmail(email);
    const now = Date.now();

    const insertedRows = await queryD1(
        `INSERT INTO ${FREE_PAYSLIP_CLAIMS_TABLE} (
                email,
                claimed_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?)
            ON CONFLICT(email) DO NOTHING
            RETURNING email, claimed_at, created_at, updated_at`,
        [normalizedEmail, now, now, now],
    );

    if (insertedRows.length === 0) {
        const existing = await getClaimRow(normalizedEmail);
        if (existing) {
            throw new FreePayslipClaimError(FREE_PAYSLIP_ALREADY_USED_MESSAGE, 409);
        }

        throw new FreePayslipClaimError("The free payslip claim could not be recorded.", 503, true);
    }

    return rowToClaimStatus(rowToClaim(insertedRows[0]));
}

export function toFreePayslipClaimErrorResponse(error: unknown) {
    if (error instanceof FreePayslipClaimError) {
        return { status: error.status, message: error.message };
    }

    return { status: 500, message: "The free payslip service had an unexpected error." };
}
