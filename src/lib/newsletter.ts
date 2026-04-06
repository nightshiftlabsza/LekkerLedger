type QueryParam = string | number | null;
const D1_QUERY_TIMEOUT_MS = 8_000;
const D1_MAX_ATTEMPTS = 2;

interface D1ApiEnvelope {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: unknown;
}

class NewsletterError extends Error {
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
        throw new NewsletterError(`${name} is missing.`, 503);
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
            throw new NewsletterError(
                payload.errors?.[0]?.message || "Cloudflare D1 query failed.",
                status,
                response.status >= 500,
            );
        }

        return extractD1Rows(payload);
    } catch (error) {
        if (error instanceof NewsletterError) {
            throw error;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
            throw new NewsletterError("The newsletter service took too long to respond.", 503, true);
        }

        throw new NewsletterError("The newsletter service could not be reached.", 503, true);
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
            if (!(error instanceof NewsletterError && error.retryable) || attempt === D1_MAX_ATTEMPTS) {
                throw error;
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new NewsletterError("The newsletter service could not be reached.", 503, false);
}

let schemaPromise: Promise<void> | null = null;

async function ensureNewsletterSchema(): Promise<void> {
    schemaPromise ??= (async () => {
        await queryD1(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                email TEXT PRIMARY KEY,
                subscribed_at INTEGER NOT NULL,
                drip_1_sent_at INTEGER,
                drip_2_sent_at INTEGER,
                drip_3_sent_at INTEGER
            )
        `);
    })();

    await schemaPromise;
}

export async function addNewsletterSubscriber(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    await ensureNewsletterSchema();
    await queryD1(
        "INSERT OR IGNORE INTO newsletter_subscribers (email, subscribed_at) VALUES (?, ?)",
        [normalized, Date.now()],
    );
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getSubscribersDueForDrip(dripNumber: 1 | 2 | 3): Promise<Array<{ email: string; subscribed_at: number }>> {
    await ensureNewsletterSchema();

    const now = Date.now();
    let sql: string;
    let params: QueryParam[];

    switch (dripNumber) {
        case 1:
            sql = "SELECT email, subscribed_at FROM newsletter_subscribers WHERE drip_1_sent_at IS NULL AND subscribed_at <= ?";
            params = [now - 3 * DAY_MS];
            break;
        case 2:
            sql = "SELECT email, subscribed_at FROM newsletter_subscribers WHERE drip_2_sent_at IS NULL AND drip_1_sent_at IS NOT NULL AND subscribed_at <= ?";
            params = [now - 7 * DAY_MS];
            break;
        case 3:
            sql = "SELECT email, subscribed_at FROM newsletter_subscribers WHERE drip_3_sent_at IS NULL AND drip_2_sent_at IS NOT NULL AND subscribed_at <= ?";
            params = [now - 14 * DAY_MS];
            break;
    }

    const rows = await queryD1(sql, params);
    return rows.map((row) => ({
        email: typeof row.email === "string" ? row.email : "",
        subscribed_at: Number(row.subscribed_at || 0),
    }));
}

export async function markDripSent(email: string, dripNumber: 1 | 2 | 3): Promise<void> {
    await ensureNewsletterSchema();
    const column = `drip_${dripNumber}_sent_at`;
    await queryD1(
        `UPDATE newsletter_subscribers SET ${column} = ? WHERE email = ?`,
        [Date.now(), email.trim().toLowerCase()],
    );
}
