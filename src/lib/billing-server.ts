import { createHmac, timingSafeEqual } from "crypto";
import { BillingCycle, PlanId, getPlanPrice } from "../config/plans";
import {
    addBillingInterval,
    BillingStatus,
    entitlementsFromSubscription,
    sanitizeBillingCycle,
    sanitizePlanId,
    SubscriptionRecord,
    VerifiedEntitlements,
} from "./billing";
import { env } from "./env";

type QueryParam = string | number | null;

class BillingError extends Error {
    status: number;

    constructor(message: string, status = 500) {
        super(message);
        this.status = status;
    }
}

export class BillingConfigError extends BillingError {
    constructor(message: string) {
        super(message, 503);
    }
}

export class BillingAuthError extends BillingError {
    constructor(message: string) {
        super(message, 401);
    }
}

export interface VerifiedGoogleUser {
    userId: string;
    email: string;
    name?: string;
}

interface D1ApiEnvelope {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: unknown;
}

interface PaystackInitializeResponse {
    status?: boolean;
    message?: string;
    data?: {
        authorization_url?: string;
        reference?: string;
    };
}

interface WebhookResolution {
    userId: string;
    email: string;
    customerId: string | null;
    subscriptionCode: string | null;
    planCode: string | null;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    status: BillingStatus;
    currentPeriodEnd: number;
}

let schemaPromise: Promise<void> | null = null;

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new BillingConfigError(`${name} is missing.`);
    }
    return value;
}

function getPaystackSecretKey(): string {
    return env.PAYSTACK_SECRET_KEY;
}

function getD1Config() {
    return {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        databaseId: env.CLOUDFLARE_D1_DATABASE_ID,
        apiToken: env.CLOUDFLARE_D1_API_TOKEN,
    };
}

function getPaystackPlanCode(planId: Exclude<PlanId, "free">, billingCycle: BillingCycle): string {
    const envMap = {
        standard: {
            monthly: env.PAYSTACK_PLAN_STANDARD_MONTHLY,
            yearly: env.PAYSTACK_PLAN_STANDARD_YEARLY,
        },
        pro: {
            monthly: env.PAYSTACK_PLAN_PRO_MONTHLY,
            yearly: env.PAYSTACK_PLAN_PRO_YEARLY,
        },
    } as const;

    const planCode = envMap[planId][billingCycle];
    if (!planCode) {
        throw new BillingConfigError(`Paystack plan code missing for ${planId} ${billingCycle}.`);
    }

    return planCode;
}

function getPaystackPlanLookup() {
    return new Map<string, { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle }>([
        [env.PAYSTACK_PLAN_STANDARD_MONTHLY || "", { planId: "standard", billingCycle: "monthly" }],
        [env.PAYSTACK_PLAN_STANDARD_YEARLY || "", { planId: "standard", billingCycle: "yearly" }],
        [env.PAYSTACK_PLAN_PRO_MONTHLY || "", { planId: "pro", billingCycle: "monthly" }],
        [env.PAYSTACK_PLAN_PRO_YEARLY || "", { planId: "pro", billingCycle: "yearly" }],
    ]);
}

function normalizeOrigin(request: Request): string {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (forwardedHost) {
        return `${forwardedProto || "https"}://${forwardedHost}`;
    }

    return new URL(request.url).origin;
}

function parseMetadata(value: unknown): Record<string, unknown> {
    if (!value) return {};
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
        } catch {
            return {};
        }
    }

    return typeof value === "object" ? value as Record<string, unknown> : {};
}

function getNestedValue(input: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((current, key) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[key];
    }, input);
}

function getStringFromPaths(input: unknown, paths: string[]): string | null {
    for (const path of paths) {
        const value = getNestedValue(input, path);
        if (typeof value === "string" && value.trim()) return value.trim();
    }

    return null;
}

function getMetadataValue(metadata: Record<string, unknown>, key: string): string | null {
    const direct = metadata[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();

    const customFields = metadata.custom_fields;
    if (!Array.isArray(customFields)) return null;

    for (const field of customFields) {
        if (!field || typeof field !== "object") continue;
        const variableName = (field as Record<string, unknown>).variable_name;
        const value = (field as Record<string, unknown>).value;
        if (variableName === key && typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return null;
}

function parseTimestamp(value: string | null): number | null {
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

function rowToSubscriptionRecord(row: Record<string, unknown>): SubscriptionRecord {
    return {
        userId: String(row.user_id),
        email: String(row.email),
        paystackCustomerId: row.paystack_customer_id ? String(row.paystack_customer_id) : null,
        paystackSubscriptionCode: row.paystack_subscription_code ? String(row.paystack_subscription_code) : null,
        paystackPlanCode: row.paystack_plan_code ? String(row.paystack_plan_code) : null,
        planId: sanitizePlanId(String(row.plan_id)),
        billingCycle: sanitizeBillingCycle(String(row.billing_cycle)),
        status: String(row.status || "unknown") as BillingStatus,
        currentPeriodEnd: Number(row.current_period_end || 0),
        updatedAt: Number(row.updated_at || 0),
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
        const message = payload.errors?.[0]?.message || "Cloudflare D1 query failed.";
        throw new BillingError(message, 502);
    }

    return extractD1Rows(payload);
}

async function ensureBillingSchema() {
    if (!schemaPromise) {
        schemaPromise = (async () => {
            await queryD1(`
                CREATE TABLE IF NOT EXISTS subscriptions (
                    user_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    paystack_customer_id TEXT UNIQUE,
                    paystack_subscription_code TEXT UNIQUE,
                    paystack_plan_code TEXT,
                    plan_id TEXT NOT NULL,
                    billing_cycle TEXT NOT NULL,
                    status TEXT NOT NULL,
                    current_period_end INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            `);
            await queryD1("CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(paystack_customer_id)");
            await queryD1("CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_code ON subscriptions(paystack_subscription_code)");
        })();
    }

    await schemaPromise;
}

async function getSubscriptionByColumn(column: "user_id" | "email" | "paystack_customer_id" | "paystack_subscription_code", value: string | null | undefined): Promise<SubscriptionRecord | null> {
    if (!value) return null;
    await ensureBillingSchema();
    const rows = await queryD1(`SELECT * FROM subscriptions WHERE ${column} = ? LIMIT 1`, [value]);
    return rows[0] ? rowToSubscriptionRecord(rows[0]) : null;
}

async function upsertSubscription(record: SubscriptionRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            INSERT INTO subscriptions (
                user_id,
                email,
                paystack_customer_id,
                paystack_subscription_code,
                paystack_plan_code,
                plan_id,
                billing_cycle,
                status,
                current_period_end,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                email = excluded.email,
                paystack_customer_id = COALESCE(excluded.paystack_customer_id, subscriptions.paystack_customer_id),
                paystack_subscription_code = COALESCE(excluded.paystack_subscription_code, subscriptions.paystack_subscription_code),
                paystack_plan_code = COALESCE(excluded.paystack_plan_code, subscriptions.paystack_plan_code),
                plan_id = excluded.plan_id,
                billing_cycle = excluded.billing_cycle,
                status = excluded.status,
                current_period_end = excluded.current_period_end,
                updated_at = excluded.updated_at
        `,
        [
            record.userId,
            record.email,
            record.paystackCustomerId ?? null,
            record.paystackSubscriptionCode ?? null,
            record.paystackPlanCode ?? null,
            record.planId,
            record.billingCycle,
            record.status,
            record.currentPeriodEnd,
            record.updatedAt,
        ],
    );
}

async function resolveExistingSubscription(identity: {
    userId?: string | null;
    email?: string | null;
    customerId?: string | null;
    subscriptionCode?: string | null;
}): Promise<SubscriptionRecord | null> {
    return (
        await getSubscriptionByColumn("user_id", identity.userId) ||
        await getSubscriptionByColumn("paystack_subscription_code", identity.subscriptionCode) ||
        await getSubscriptionByColumn("paystack_customer_id", identity.customerId) ||
        await getSubscriptionByColumn("email", identity.email)
    );
}

function mapPlanCode(planCode: string | null): { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle } | null {
    if (!planCode) return null;
    const match = getPaystackPlanLookup().get(planCode);
    return match || null;
}

function resolveWebhookPlan(input: {
    metadata: Record<string, unknown>;
    planCode: string | null;
}): { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle } | null {
    const mappedFromCode = mapPlanCode(input.planCode);
    if (mappedFromCode) return mappedFromCode;

    const metadataPlanId = sanitizePlanId(getMetadataValue(input.metadata, "plan_id"));
    const metadataCycle = sanitizeBillingCycle(getMetadataValue(input.metadata, "billing_cycle"));
    if (metadataPlanId === "standard" || metadataPlanId === "pro") {
        return {
            planId: metadataPlanId,
            billingCycle: metadataCycle,
        };
    }

    return null;
}

function buildWebhookResolution(event: string, payload: Record<string, unknown>, existing: SubscriptionRecord | null): WebhookResolution | null {
    const data = (payload.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
    const metadata = parseMetadata(data.metadata);
    const mappedPlan = resolveWebhookPlan({
        metadata,
        planCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]),
    });

    if (!mappedPlan) return null;

    const customerId = getStringFromPaths(data, ["customer.customer_code", "customer_code"]);
    const subscriptionCode = getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]);
    const userId = getMetadataValue(metadata, "user_id") || existing?.userId || null;
    const email = getStringFromPaths(data, ["customer.email", "email"]) || existing?.email || null;

    if (!userId || !email) {
        return null;
    }

    const explicitPeriodEnd =
        parseTimestamp(getStringFromPaths(data, ["next_payment_date", "subscription.next_payment_date"])) ||
        parseTimestamp(getStringFromPaths(data, ["current_period_end"])) ||
        null;
    const paidAt =
        parseTimestamp(getStringFromPaths(data, ["paid_at", "paidAt", "created_at"])) ||
        Date.now();
    const fallbackPeriodEnd = addBillingInterval(new Date(paidAt), mappedPlan.billingCycle).getTime();
    const now = Date.now();

    if (event === "charge.success" || event === "subscription.create") {
        return {
            userId,
            email,
            customerId,
            subscriptionCode,
            planCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]),
            planId: mappedPlan.planId,
            billingCycle: mappedPlan.billingCycle,
            status: "active",
            currentPeriodEnd: explicitPeriodEnd || fallbackPeriodEnd,
        };
    }

    if (event === "invoice.payment_failed") {
        return {
            userId,
            email,
            customerId,
            subscriptionCode,
            planCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]),
            planId: existing?.planId === "pro" ? "pro" : mappedPlan.planId,
            billingCycle: existing?.billingCycle || mappedPlan.billingCycle,
            status: "past_due",
            currentPeriodEnd: existing?.currentPeriodEnd || explicitPeriodEnd || fallbackPeriodEnd,
        };
    }

    if (event === "subscription.disable" || event === "subscription.not_renew") {
        return {
            userId,
            email,
            customerId,
            subscriptionCode,
            planCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]),
            planId: existing?.planId === "pro" ? "pro" : mappedPlan.planId,
            billingCycle: existing?.billingCycle || mappedPlan.billingCycle,
            status: "canceled",
            currentPeriodEnd: existing?.currentPeriodEnd || explicitPeriodEnd || fallbackPeriodEnd,
        };
    }

    if (event === "refund.processed") {
        return {
            userId,
            email,
            customerId,
            subscriptionCode,
            planCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]),
            planId: existing?.planId === "pro" ? "pro" : mappedPlan.planId,
            billingCycle: existing?.billingCycle || mappedPlan.billingCycle,
            status: "refunded",
            currentPeriodEnd: now,
        };
    }

    return null;
}

export async function verifyGoogleUserFromRequest(request: Request): Promise<VerifiedGoogleUser> {
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
    if (!accessToken) {
        throw new BillingAuthError("Google sign-in is required.");
    }

    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new BillingAuthError("Google sign-in could not be verified.");
    }

    const data = await response.json() as { sub?: string; email?: string; name?: string };
    if (!data.sub || !data.email) {
        throw new BillingAuthError("Google sign-in could not be verified.");
    }

    return {
        userId: data.sub,
        email: data.email,
        name: data.name,
    };
}

export async function createCheckoutSession(
    request: Request,
    user: VerifiedGoogleUser,
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle },
): Promise<{ authorizationUrl: string; reference: string }> {
    const paystackSecretKey = getPaystackSecretKey();
    const planCode = getPaystackPlanCode(input.planId, input.billingCycle);
    const amount = getPlanPrice(input.planId, input.billingCycle);

    if (!amount) {
        throw new BillingError("Pricing is not configured for that plan.", 400);
    }

    const origin = normalizeOrigin(request);
    const reference = `ll_${user.userId}_${Date.now()}`;
    const callbackUrl = `${origin}/billing/success`;
    const metadata = JSON.stringify({
        user_id: user.userId,
        plan_id: input.planId,
        billing_cycle: input.billingCycle,
        source: "upgrade_page",
    });

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            reference,
            email: user.email,
            amount: amount * 100,
            plan: planCode,
            callback_url: callbackUrl,
            channels: ["card"],
            metadata,
        }),
        cache: "no-store",
    });

    const payload = await response.json() as PaystackInitializeResponse;
    if (!response.ok || !payload.status || !payload.data?.authorization_url || !payload.data.reference) {
        throw new BillingError(payload.message || "Paystack checkout could not be started.", 502);
    }

    return {
        authorizationUrl: payload.data.authorization_url,
        reference: payload.data.reference,
    };
}

export async function getVerifiedEntitlementsForUser(userId: string): Promise<VerifiedEntitlements> {
    const record = await getSubscriptionByColumn("user_id", userId);
    return entitlementsFromSubscription(record);
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = createHmac("sha512", getPaystackSecretKey()).update(rawBody).digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function processPaystackWebhook(rawBody: string): Promise<{ handled: boolean }> {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const event = typeof payload.event === "string" ? payload.event : "";
    if (!event) {
        throw new BillingError("Webhook event missing.", 400);
    }

    const data = (payload.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
    const metadata = parseMetadata(data.metadata);
    const customerId = getStringFromPaths(data, ["customer.customer_code", "customer_code"]);
    const subscriptionCode = getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]);
    const email = getStringFromPaths(data, ["customer.email", "email"]) || getMetadataValue(metadata, "email");
    const userId = getMetadataValue(metadata, "user_id");
    const existing = await resolveExistingSubscription({
        userId,
        email,
        customerId,
        subscriptionCode,
    });

    const resolved = buildWebhookResolution(event, payload, existing);
    if (!resolved) {
        return { handled: false };
    }

    await upsertSubscription({
        userId: resolved.userId,
        email: resolved.email,
        paystackCustomerId: resolved.customerId,
        paystackSubscriptionCode: resolved.subscriptionCode,
        paystackPlanCode: resolved.planCode,
        planId: resolved.planId,
        billingCycle: resolved.billingCycle,
        status: resolved.status,
        currentPeriodEnd: resolved.currentPeriodEnd,
        updatedAt: Date.now(),
    });

    return { handled: true };
}

export function toErrorResponse(error: unknown): { status: number; message: string } {
    if (error instanceof BillingError) {
        return { status: error.status, message: error.message };
    }

    return {
        status: 500,
        message: "Billing request failed.",
    };
}
