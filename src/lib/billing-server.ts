import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { BillingCycle, PlanId, getPlanPrice } from "../config/plans";
import {
    addBillingInterval,
    addCalendarMonths,
    BillingCreditRecord,
    BillingCreditStatus,
    BillingIntentRecord,
    BillingAccountSummary,
    entitlementsFromSubscription,
    isPaidPlanId,
    ReferralCodeRecord,
    ReferralRecord,
    sanitizeBillingCycle,
    sanitizeBillingIntentStatus,
    sanitizeBillingStatus,
    sanitizePlanId,
    sanitizeReferralStatus,
    SubscriptionRecord,
    VerifiedEntitlements,
} from "./billing";
import { getRequestAppOrigin } from "./app-origin";
import { env } from "./env";
import { createClient } from "./supabase/server";

type QueryParam = string | number | null;

const REFUND_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const REFERRAL_REWARD_MONTHS = 1;
const REFERRAL_REWARD_CAP_MONTHS = 12;
const GUEST_INTENT_USER_PREFIX = "guest_";

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

export interface VerifiedUser {
    userId: string;
    email: string;
    name?: string;
}

export interface BillingAccountResponse {
    entitlements: VerifiedEntitlements;
    account: BillingAccountSummary;
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
        access_code?: string;
        reference?: string;
    };
}

interface PaystackCreateSubscriptionResponse {
    status?: boolean;
    message?: string;
    data?: {
        subscription_code?: string;
        email_token?: string;
        next_payment_date?: string;
    };
}

interface PaystackBasicResponse {
    status?: boolean;
    message?: string;
}

interface PaystackVerifyTransactionResponse extends PaystackBasicResponse {
    data?: Record<string, unknown> & {
        status?: string;
        reference?: string;
    };
}

interface PaystackAuthorization {
    authorizationCode: string;
    signature: string | null;
    last4: string | null;
    reusable: boolean;
}

let schemaPromise: Promise<void> | null = null;

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value || value === "undefined" || value === "null") {
        throw new BillingConfigError(`${name} is missing.`);
    }
    return value;
}

function getPaystackSecretKey(): string {
    return getRequiredEnv("PAYSTACK_SECRET_KEY");
}

function getD1Config() {
    return {
        accountId: getRequiredEnv("CLOUDFLARE_ACCOUNT_ID"),
        databaseId: getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID"),
        apiToken: getRequiredEnv("CLOUDFLARE_D1_API_TOKEN"),
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

function toIso(timestamp: number | null | undefined): string | undefined {
    if (!timestamp) return undefined;
    return new Date(timestamp).toISOString();
}

function sanitizeReferralCode(value: string | null | undefined): string | null {
    const trimmed = value?.trim().toUpperCase() || "";
    return trimmed ? trimmed.replaceAll(/[^A-Z0-9]/g, "") : null;
}

function normalizeEmailAddress(value: string): string {
    return value.trim().toLowerCase();
}

function buildGuestIntentUserId(): string {
    return `${GUEST_INTENT_USER_PREFIX}${randomUUID()}`;
}

function isGuestIntentUserId(value: string | null | undefined): boolean {
    return typeof value === "string" && value.startsWith(GUEST_INTENT_USER_PREFIX);
}

function buildBillingReference(userId: string): string {
    return `purchase_${userId}_${Date.now()}`;
}

function buildEventKey(event: string, payload: Record<string, unknown>): string {
    const data = (payload.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
    const metadata = parseMetadata(data.metadata);
    const reference = getStringFromPaths(data, ["reference"]);
    const subscriptionCode = getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]);
    const customerCode = getStringFromPaths(data, ["customer.customer_code", "customer_code"]);
    const userId = getMetadataValue(metadata, "user_id");
    const timestamp = getStringFromPaths(data, ["paid_at", "created_at", "transaction_date", "next_payment_date"]) || "";
    return [event, reference || subscriptionCode || customerCode || userId || "unknown", timestamp].join(":");
}

export function paymentBelongsToDifferentAccount(input: {
    metadataUserId: string | null;
    intent: BillingIntentRecord | null;
    paymentEmail: string | null;
    user: VerifiedUser;
}) {
    const guestMetadataUserId = isGuestIntentUserId(input.metadataUserId);
    if (input.metadataUserId && input.metadataUserId !== input.user.userId && !guestMetadataUserId) {
        return true;
    }

    if (input.intent && input.intent.userId !== input.user.userId && !isGuestIntentUserId(input.intent.userId)) {
        return true;
    }

    if (!input.metadataUserId && !input.intent && input.paymentEmail) {
        return input.paymentEmail.toLowerCase() !== input.user.email.toLowerCase();
    }

    return false;
}

function rowToSubscriptionRecord(row: Record<string, unknown>): SubscriptionRecord {
    return {
        userId: String(row.user_id),
        email: String(row.email),
        paystackCustomerId: row.paystack_customer_id ? String(row.paystack_customer_id) : null,
        paystackSubscriptionCode: row.paystack_subscription_code ? String(row.paystack_subscription_code) : null,
        paystackPlanCode: row.paystack_plan_code ? String(row.paystack_plan_code) : null,
        paystackEmailToken: row.paystack_email_token ? String(row.paystack_email_token) : null,
        paystackAuthorizationCode: row.paystack_authorization_code ? String(row.paystack_authorization_code) : null,
        paystackAuthorizationSignature: row.paystack_authorization_signature ? String(row.paystack_authorization_signature) : null,
        paystackAuthorizationLast4: row.paystack_authorization_last4 ? String(row.paystack_authorization_last4) : null,
        planId: sanitizePlanId(String(row.plan_id)),
        billingCycle: sanitizeBillingCycle(String(row.billing_cycle)),
        status: sanitizeBillingStatus(String(row.status || "unknown")),
        currentPeriodEnd: Number(row.current_period_end || 0),
        nextChargeAt: row.next_charge_at === null || row.next_charge_at === undefined ? null : Number(row.next_charge_at || 0),
        cancelAtPeriodEnd: Boolean(Number(row.cancel_at_period_end || 0)),
        lastError: row.last_error ? String(row.last_error) : null,
        updatedAt: Number(row.updated_at || 0),
    };
}

function rowToBillingIntentRecord(row: Record<string, unknown>): BillingIntentRecord {
    return {
        id: String(row.id),
        reference: String(row.reference),
        userId: String(row.user_id),
        email: String(row.email),
        planId: sanitizePlanId(String(row.plan_id)) as Exclude<PlanId, "free">,
        billingCycle: sanitizeBillingCycle(String(row.billing_cycle)),
        referralCode: row.referral_code ? String(row.referral_code) : null,
        amountCents: Number(row.amount_cents || 0),
        status: sanitizeBillingIntentStatus(String(row.status || "pending")),
        createdAt: Number(row.created_at || 0),
        updatedAt: Number(row.updated_at || 0),
    };
}

function rowToReferralCodeRecord(row: Record<string, unknown>): ReferralCodeRecord {
    return {
        userId: String(row.user_id),
        code: String(row.code),
        createdAt: Number(row.created_at || 0),
    };
}

function rowToReferralRecord(row: Record<string, unknown>): ReferralRecord {
    return {
        id: String(row.id),
        referrerUserId: String(row.referrer_user_id),
        refereeUserId: String(row.referee_user_id),
        refereeEmail: String(row.referee_email),
        referralCode: String(row.referral_code),
        planId: sanitizePlanId(String(row.plan_id)) as Exclude<PlanId, "free">,
        billingCycle: sanitizeBillingCycle(String(row.billing_cycle)),
        status: sanitizeReferralStatus(String(row.status || "pending_first_charge")),
        qualifiedAt: row.qualified_at === null || row.qualified_at === undefined ? null : Number(row.qualified_at || 0),
        pendingUntil: row.pending_until === null || row.pending_until === undefined ? null : Number(row.pending_until || 0),
        createdAt: Number(row.created_at || 0),
        updatedAt: Number(row.updated_at || 0),
    };
}

function rowToBillingCreditRecord(row: Record<string, unknown>): BillingCreditRecord {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        referralId: String(row.referral_id),
        months: Number(row.months || 0),
        status: String(row.status || "pending") as BillingCreditStatus,
        availableAt: row.available_at === null || row.available_at === undefined ? null : Number(row.available_at || 0),
        appliedAt: row.applied_at === null || row.applied_at === undefined ? null : Number(row.applied_at || 0),
        createdAt: Number(row.created_at || 0),
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

async function getTableColumns(tableName: string): Promise<Set<string>> {
    const rows = await queryD1(`PRAGMA table_info(${tableName})`);
    return new Set(rows.map((row) => String(row.name)));
}

async function ensureColumns(tableName: string, columnsByName: Record<string, string>) {
    const columns = await getTableColumns(tableName);
    for (const [columnName, columnDefinition] of Object.entries(columnsByName)) {
        if (!columns.has(columnName)) {
            await queryD1(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
        }
    }
}

async function ensureBillingSchema() {
    if (schemaPromise === null) {
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
            await ensureColumns("subscriptions", {
                paystack_email_token: "TEXT",
                paystack_authorization_code: "TEXT",
                paystack_authorization_signature: "TEXT",
                paystack_authorization_last4: "TEXT",
                next_charge_at: "INTEGER",
                cancel_at_period_end: "INTEGER NOT NULL DEFAULT 0",
                last_error: "TEXT",
            });
            await queryD1("CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(paystack_customer_id)");
            await queryD1("CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_code ON subscriptions(paystack_subscription_code)");
            await queryD1("CREATE INDEX IF NOT EXISTS idx_subscriptions_authorization_signature ON subscriptions(paystack_authorization_signature)");

            await queryD1(`
                CREATE TABLE IF NOT EXISTS billing_intents (
                    id TEXT PRIMARY KEY,
                    reference TEXT NOT NULL UNIQUE,
                    user_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    plan_id TEXT NOT NULL,
                    billing_cycle TEXT NOT NULL,
                    referral_code TEXT,
                    amount_cents INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            `);
            await queryD1("CREATE INDEX IF NOT EXISTS idx_billing_intents_user_id ON billing_intents(user_id)");

            await queryD1(`
                CREATE TABLE IF NOT EXISTS billing_events (
                    event_key TEXT PRIMARY KEY,
                    event_name TEXT NOT NULL,
                    reference TEXT,
                    created_at INTEGER NOT NULL
                )
            `);

            await queryD1(`
                CREATE TABLE IF NOT EXISTS referral_codes (
                    user_id TEXT PRIMARY KEY,
                    code TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL
                )
            `);

            await queryD1(`
                CREATE TABLE IF NOT EXISTS referrals (
                    id TEXT PRIMARY KEY,
                    referrer_user_id TEXT NOT NULL,
                    referee_user_id TEXT NOT NULL UNIQUE,
                    referee_email TEXT NOT NULL,
                    referral_code TEXT NOT NULL,
                    plan_id TEXT NOT NULL,
                    billing_cycle TEXT NOT NULL,
                    status TEXT NOT NULL,
                    qualified_at INTEGER,
                    pending_until INTEGER,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            `);
            await queryD1("CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id)");

            await queryD1(`
                CREATE TABLE IF NOT EXISTS billing_credits (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    referral_id TEXT NOT NULL,
                    months INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    available_at INTEGER,
                    applied_at INTEGER,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            `);
            await queryD1("CREATE INDEX IF NOT EXISTS idx_billing_credits_user_id ON billing_credits(user_id)");

            // One-time cleanup for legacy trial-era rows so the runtime no longer needs to
            // understand deprecated trial statuses.
            await queryD1("UPDATE subscriptions SET status = 'active' WHERE status = 'trialing'");
            await queryD1("UPDATE billing_intents SET status = 'completed' WHERE status = 'trial_started'");
            await queryD1("UPDATE referrals SET status = 'pending_first_charge' WHERE status = 'trial_started'");
        })();
    }

    await schemaPromise;
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
    const rawKey = getPaystackSecretKey();
    const secretKey = rawKey.replaceAll(/[^\x20-\x7E]/g, "");

    if (secretKey.length !== rawKey.length) {
        console.warn(`[Billing] Stripped ${rawKey.length - secretKey.length} non-printable/non-ASCII character(s) from PAYSTACK_SECRET_KEY`);
    }

    const response = await fetch(`https://api.paystack.co${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
        cache: "no-store",
    });

    const bodyText = await response.text();
    let payload: T & PaystackBasicResponse;
    try {
        payload = JSON.parse(bodyText);
    } catch {
        throw new BillingError(`Paystack returned invalid JSON (Status: ${response.status}). Body: ${bodyText.slice(0, 200)}`, 502);
    }

    if (!response.ok || payload.status === false) {
        console.error(`[Billing] Paystack error: ${payload.message || "Unknown error"}`, {
            path,
            status: response.status,
            payload
        });
        throw new BillingError(payload.message || "Paystack request failed.", 502);
    }

    return payload;
}

async function getSubscriptionByColumn(
    column: "user_id" | "email" | "paystack_customer_id" | "paystack_subscription_code" | "paystack_authorization_signature",
    value: string | null | undefined,
): Promise<SubscriptionRecord | null> {
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
                paystack_email_token,
                paystack_authorization_code,
                paystack_authorization_signature,
                paystack_authorization_last4,
                plan_id,
                billing_cycle,
                status,
                current_period_end,
                next_charge_at,
                cancel_at_period_end,
                last_error,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                email = excluded.email,
                paystack_customer_id = COALESCE(excluded.paystack_customer_id, subscriptions.paystack_customer_id),
                paystack_subscription_code = COALESCE(excluded.paystack_subscription_code, subscriptions.paystack_subscription_code),
                paystack_plan_code = COALESCE(excluded.paystack_plan_code, subscriptions.paystack_plan_code),
                paystack_email_token = COALESCE(excluded.paystack_email_token, subscriptions.paystack_email_token),
                paystack_authorization_code = COALESCE(excluded.paystack_authorization_code, subscriptions.paystack_authorization_code),
                paystack_authorization_signature = COALESCE(excluded.paystack_authorization_signature, subscriptions.paystack_authorization_signature),
                paystack_authorization_last4 = COALESCE(excluded.paystack_authorization_last4, subscriptions.paystack_authorization_last4),
                plan_id = excluded.plan_id,
                billing_cycle = excluded.billing_cycle,
                status = excluded.status,
                current_period_end = excluded.current_period_end,
                next_charge_at = excluded.next_charge_at,
                cancel_at_period_end = excluded.cancel_at_period_end,
                last_error = excluded.last_error,
                updated_at = excluded.updated_at
        `,
        [
            record.userId,
            record.email,
            record.paystackCustomerId ?? null,
            record.paystackSubscriptionCode ?? null,
            record.paystackPlanCode ?? null,
            record.paystackEmailToken ?? null,
            record.paystackAuthorizationCode ?? null,
            record.paystackAuthorizationSignature ?? null,
            record.paystackAuthorizationLast4 ?? null,
            record.planId,
            record.billingCycle,
            record.status,
            record.currentPeriodEnd,
            record.nextChargeAt ?? null,
            record.cancelAtPeriodEnd ? 1 : 0,
            record.lastError ?? null,
            record.updatedAt,
        ],
    );
}

async function getBillingIntentByReference(reference: string): Promise<BillingIntentRecord | null> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM billing_intents WHERE reference = ? LIMIT 1", [reference]);
    return rows[0] ? rowToBillingIntentRecord(rows[0]) : null;
}

async function getBillingIntentById(id: string | null | undefined): Promise<BillingIntentRecord | null> {
    if (!id) return null;
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM billing_intents WHERE id = ? LIMIT 1", [id]);
    return rows[0] ? rowToBillingIntentRecord(rows[0]) : null;
}

async function upsertBillingIntent(record: BillingIntentRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            INSERT INTO billing_intents (
                id,
                reference,
                user_id,
                email,
                plan_id,
                billing_cycle,
                referral_code,
                amount_cents,
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                reference = excluded.reference,
                user_id = excluded.user_id,
                email = excluded.email,
                plan_id = excluded.plan_id,
                billing_cycle = excluded.billing_cycle,
                referral_code = excluded.referral_code,
                amount_cents = excluded.amount_cents,
                status = excluded.status,
                updated_at = excluded.updated_at
        `,
        [
            record.id,
            record.reference,
            record.userId,
            record.email,
            record.planId,
            record.billingCycle,
            record.referralCode ?? null,
            record.amountCents,
            record.status,
            record.createdAt,
            record.updatedAt,
        ],
    );
}

async function markBillingEventProcessed(eventKey: string, eventName: string, reference: string | null): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        "INSERT OR IGNORE INTO billing_events (event_key, event_name, reference, created_at) VALUES (?, ?, ?, ?)",
        [eventKey, eventName, reference, Date.now()],
    );
}

async function hasBillingEvent(eventKey: string): Promise<boolean> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT event_key FROM billing_events WHERE event_key = ? LIMIT 1", [eventKey]);
    return rows.length > 0;
}

async function getReferralCodeByCode(code: string | null | undefined): Promise<ReferralCodeRecord | null> {
    if (!code) return null;
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM referral_codes WHERE code = ? LIMIT 1", [code]);
    return rows[0] ? rowToReferralCodeRecord(rows[0]) : null;
}

async function getReferralCodeByUserId(userId: string): Promise<ReferralCodeRecord | null> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM referral_codes WHERE user_id = ? LIMIT 1", [userId]);
    return rows[0] ? rowToReferralCodeRecord(rows[0]) : null;
}

async function ensureReferralCodeForUser(userId: string): Promise<ReferralCodeRecord> {
    const existing = await getReferralCodeByUserId(userId);
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = randomUUID().replaceAll(/-/g, "").slice(0, 8).toUpperCase();
        try {
            const createdAt = Date.now();
            await queryD1(
                "INSERT INTO referral_codes (user_id, code, created_at) VALUES (?, ?, ?)",
                [userId, code, createdAt],
            );
            return { userId, code, createdAt };
        } catch {
            // Retry on rare collisions.
        }
    }

    throw new BillingError("Could not create a referral code.");
}

async function getReferralByReferee(refereeUserId: string): Promise<ReferralRecord | null> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM referrals WHERE referee_user_id = ? LIMIT 1", [refereeUserId]);
    return rows[0] ? rowToReferralRecord(rows[0]) : null;
}

async function createReferral(record: ReferralRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            INSERT INTO referrals (
                id,
                referrer_user_id,
                referee_user_id,
                referee_email,
                referral_code,
                plan_id,
                billing_cycle,
                status,
                qualified_at,
                pending_until,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            record.id,
            record.referrerUserId,
            record.refereeUserId,
            record.refereeEmail,
            record.referralCode,
            record.planId,
            record.billingCycle,
            record.status,
            record.qualifiedAt ?? null,
            record.pendingUntil ?? null,
            record.createdAt,
            record.updatedAt,
        ],
    );
}

async function updateReferral(record: ReferralRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            UPDATE referrals
            SET plan_id = ?, billing_cycle = ?, status = ?, qualified_at = ?, pending_until = ?, updated_at = ?
            WHERE id = ?
        `,
        [
            record.planId,
            record.billingCycle,
            record.status,
            record.qualifiedAt ?? null,
            record.pendingUntil ?? null,
            record.updatedAt,
            record.id,
        ],
    );
}

async function getCreditsForUser(userId: string): Promise<BillingCreditRecord[]> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM billing_credits WHERE user_id = ?", [userId]);
    return rows.map(rowToBillingCreditRecord);
}

async function getCreditsByReferralId(referralId: string): Promise<BillingCreditRecord[]> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM billing_credits WHERE referral_id = ?", [referralId]);
    return rows.map(rowToBillingCreditRecord);
}

async function insertCredit(record: BillingCreditRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            INSERT INTO billing_credits (
                id,
                user_id,
                referral_id,
                months,
                status,
                available_at,
                applied_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            record.id,
            record.userId,
            record.referralId,
            record.months,
            record.status,
            record.availableAt ?? null,
            record.appliedAt ?? null,
            record.createdAt,
            record.updatedAt,
        ],
    );
}

async function updateCredit(record: BillingCreditRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            UPDATE billing_credits
            SET status = ?, available_at = ?, applied_at = ?, updated_at = ?
            WHERE id = ?
        `,
        [
            record.status,
            record.availableAt ?? null,
            record.appliedAt ?? null,
            record.updatedAt,
            record.id,
        ],
    );
}

async function summarizeCreditsForUser(userId: string) {
    const credits = await getCreditsForUser(userId);
    return credits.reduce(
        (summary, credit) => {
            if (credit.status === "pending") summary.pending += credit.months;
            if (credit.status === "available") summary.available += credit.months;
            if (credit.status === "applied") summary.applied += credit.months;
            if (credit.status !== "reversed") summary.total += credit.months;
            return summary;
        },
        { pending: 0, available: 0, applied: 0, total: 0 },
    );
}

async function countSuccessfulReferrals(userId: string): Promise<number> {
    await ensureBillingSchema();
    const rows = await queryD1(
        "SELECT COUNT(*) AS count FROM referrals WHERE referrer_user_id = ? AND status = ?",
        [userId, "reward_granted"],
    );
    return Number(rows[0]?.count || 0);
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
    return getPaystackPlanLookup().get(planCode) || null;
}

function resolveWebhookPlan(input: { metadata: Record<string, unknown>; planCode: string | null }): { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle } | null {
    const mapped = mapPlanCode(input.planCode);
    if (mapped) return mapped;

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

function extractAuthorization(data: Record<string, unknown>): PaystackAuthorization | null {
    const authorization = getNestedValue(data, "authorization");
    if (!authorization || typeof authorization !== "object") {
        return null;
    }

    const auth = authorization as Record<string, unknown>;
    const authorizationCode = typeof auth.authorization_code === "string" ? auth.authorization_code : null;
    if (!authorizationCode) return null;

    return {
        authorizationCode,
        signature: typeof auth.signature === "string" ? auth.signature : null,
        last4: typeof auth.last4 === "string" ? auth.last4 : null,
        reusable: auth.reusable === true,
    };
}

async function initializePaystackTransaction(request: Request, user: VerifiedUser, input: {
    amountCents: number;
    metadata: Record<string, unknown>;
    callbackQuery?: Record<string, string>;
    reference?: string;
}): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    const origin = getRequestAppOrigin(request);
    const reference = input.reference || buildBillingReference(user.userId);
    const callbackUrl = new URL(`${origin}/billing/success`);
    if (input.callbackQuery) {
        Object.entries(input.callbackQuery).forEach(([key, value]) => callbackUrl.searchParams.set(key, value));
    }
    callbackUrl.searchParams.set("reference", reference);

    const response = await paystackRequest<PaystackInitializeResponse>("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
            reference,
            email: user.email,
            amount: input.amountCents,
            currency: "ZAR",
            callback_url: callbackUrl.toString(),
            metadata: JSON.stringify(input.metadata),
        }),
    });

    if (!response.data?.authorization_url || !response.data?.access_code || !response.data.reference) {
        throw new BillingError(response.message || "Paystack checkout could not be started.", 502);
    }

    return {
        authorizationUrl: response.data.authorization_url,
        accessCode: response.data.access_code,
        reference: response.data.reference,
    };
}

async function createPaystackSubscription(input: {
    customerId: string;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    authorizationCode: string;
    startDate: number;
}): Promise<{ subscriptionCode: string; emailToken: string | null; nextPaymentDate: number | null; planCode: string }> {
    const planCode = getPaystackPlanCode(input.planId, input.billingCycle);
    const response = await paystackRequest<PaystackCreateSubscriptionResponse>("/subscription", {
        method: "POST",
        body: JSON.stringify({
            customer: input.customerId,
            plan: planCode,
            authorization: input.authorizationCode,
            start_date: new Date(input.startDate).toISOString(),
        }),
    });

    return {
        subscriptionCode: response.data?.subscription_code || "",
        emailToken: response.data?.email_token || null,
        nextPaymentDate: parseTimestamp(response.data?.next_payment_date || null),
        planCode,
    };
}

async function disablePaystackSubscription(subscriptionCode: string, emailToken: string) {
    await paystackRequest<PaystackBasicResponse>("/subscription/disable", {
        method: "POST",
        body: JSON.stringify({
            code: subscriptionCode,
            token: emailToken,
        }),
    });
}

async function releaseMaturedCreditsForUser(userId: string): Promise<void> {
    const credits = await getCreditsForUser(userId);
    const now = Date.now();
    const matured = credits.filter((credit) => credit.status === "pending" && (credit.availableAt || 0) <= now);
    if (!matured.length) return;

    for (const credit of matured) {
        await updateCredit({
            ...credit,
            status: "available",
            updatedAt: now,
        });
    }

    const referralIds = Array.from(new Set(matured.map((credit) => credit.referralId)));
    for (const referralId of referralIds) {
        const rows = await queryD1("SELECT * FROM referrals WHERE id = ? LIMIT 1", [referralId]);
        if (!rows[0]) continue;
        const referral = rowToReferralRecord(rows[0]);
        await updateReferral({
            ...referral,
            status: "reward_granted",
            updatedAt: now,
        });
    }

    const subscription = await getSubscriptionByColumn("user_id", userId);
    if (subscription) {
        await applyAvailableCreditsToSubscription(subscription);
    }
}

async function applyAvailableCreditsToSubscription(subscription: SubscriptionRecord): Promise<SubscriptionRecord> {
    const creditSummary = await summarizeCreditsForUser(subscription.userId);
    if (
        creditSummary.available <= 0 ||
        subscription.cancelAtPeriodEnd ||
        !isPaidPlanId(subscription.planId) ||
        !subscription.paystackCustomerId ||
        !subscription.paystackAuthorizationCode
    ) {
        return subscription;
    }

    const baseChargeAt = subscription.nextChargeAt ?? subscription.currentPeriodEnd;
    if (!baseChargeAt) return subscription;

    if (subscription.paystackSubscriptionCode && subscription.paystackEmailToken) {
        await disablePaystackSubscription(subscription.paystackSubscriptionCode, subscription.paystackEmailToken);
    }

    const rescheduledStart = addCalendarMonths(new Date(baseChargeAt), creditSummary.available).getTime();
    const created = await createPaystackSubscription({
        customerId: subscription.paystackCustomerId,
        planId: subscription.planId as Exclude<PlanId, "free">,
        billingCycle: subscription.billingCycle,
        authorizationCode: subscription.paystackAuthorizationCode,
        startDate: rescheduledStart,
    });

    const credits = await getCreditsForUser(subscription.userId);
    const now = Date.now();
    for (const credit of credits.filter((entry) => entry.status === "available")) {
        await updateCredit({
            ...credit,
            status: "applied",
            appliedAt: now,
            updatedAt: now,
        });
    }

    const updatedRecord: SubscriptionRecord = {
        ...subscription,
        paystackSubscriptionCode: created.subscriptionCode || subscription.paystackSubscriptionCode,
        paystackPlanCode: created.planCode,
        paystackEmailToken: created.emailToken,
        currentPeriodEnd: rescheduledStart,
        nextChargeAt: rescheduledStart,
        lastError: null,
        updatedAt: now,
    };
    await upsertSubscription(updatedRecord);
    return updatedRecord;
}

async function buildBillingSummary(userId: string, record: SubscriptionRecord | null): Promise<BillingAccountSummary> {
    const referralCode = await ensureReferralCodeForUser(userId);
    const creditSummary = await summarizeCreditsForUser(userId);
    const successfulReferralCount = await countSuccessfulReferrals(userId);

    return {
        referralCode: referralCode.code,
        nextChargeAt: toIso(record?.nextChargeAt ?? record?.currentPeriodEnd),
        cancelAtPeriodEnd: Boolean(record?.cancelAtPeriodEnd),
        availableReferralMonths: creditSummary.available,
        pendingReferralMonths: creditSummary.pending,
        successfulReferralCount,
        totalReferralMonthsEarned: creditSummary.total,
        lastError: record?.lastError || undefined,
    };
}

async function linkReferralToPurchase(intent: BillingIntentRecord): Promise<void> {
    const referralCode = sanitizeReferralCode(intent.referralCode);
    if (!referralCode) return;
    const codeRecord = await getReferralCodeByCode(referralCode);
    if (!codeRecord || codeRecord.userId === intent.userId) return;

    const existing = await getReferralByReferee(intent.userId);
    if (existing) return;

    await createReferral({
        id: randomUUID(),
        referrerUserId: codeRecord.userId,
        refereeUserId: intent.userId,
        refereeEmail: intent.email,
        referralCode,
        planId: intent.planId,
        billingCycle: intent.billingCycle,
        status: "pending_first_charge",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
}

async function markGuestPurchaseIntentPaymentReceived(intent: BillingIntentRecord): Promise<boolean> {
    if (intent.status !== "payment_received") {
        await upsertBillingIntent({
            ...intent,
            status: "payment_received",
            updatedAt: Date.now(),
        });
    }
    return true;
}

async function claimGuestPurchaseIntentForUser(intent: BillingIntentRecord, user: VerifiedUser): Promise<BillingIntentRecord> {
    if (!isGuestIntentUserId(intent.userId)) {
        if (intent.userId !== user.userId) {
            throw new BillingAuthError("That payment has already been linked to another account.");
        }
        return intent;
    }
    const claimedIntent: BillingIntentRecord = {
        ...intent,
        userId: user.userId,
        email: user.email,
        updatedAt: Date.now(),
    };
    await upsertBillingIntent(claimedIntent);
    return claimedIntent;
}

async function qualifyReferralForFirstPaidCharge(userId: string, planId: Exclude<PlanId, "free">, billingCycle: BillingCycle, paidAt: number): Promise<void> {
    const referral = await getReferralByReferee(userId);
    if (!referral || referral.status !== "pending_first_charge") return;

    const referrerCredits = await summarizeCreditsForUser(referral.referrerUserId);
    if (referrerCredits.total >= REFERRAL_REWARD_CAP_MONTHS) {
        await updateReferral({
            ...referral,
            status: "rejected",
            updatedAt: Date.now(),
        });
        return;
    }

    const pendingUntil = paidAt + REFUND_WINDOW_MS;
    await updateReferral({
        ...referral,
        planId,
        billingCycle,
        status: "qualified_pending_reward",
        qualifiedAt: paidAt,
        pendingUntil,
        updatedAt: Date.now(),
    });

    const existingCredits = await getCreditsByReferralId(referral.id);
    if (!existingCredits.length) {
        await insertCredit({
            id: randomUUID(),
            userId: referral.referrerUserId,
            referralId: referral.id,
            months: REFERRAL_REWARD_MONTHS,
            status: "pending",
            availableAt: pendingUntil,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
}

async function handleInitialPurchaseSuccess(data: Record<string, unknown>, intent: BillingIntentRecord): Promise<void> {
    const authorization = extractAuthorization(data);
    const existing = await getSubscriptionByColumn("user_id", intent.userId);
    const customerId = getStringFromPaths(data, ["customer.customer_code", "customer_code"]);
    const subscriptionCode = getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]);
    const paidAt = parseTimestamp(getStringFromPaths(data, ["paid_at", "paidAt", "created_at"])) || Date.now();
    const currentPeriodEnd = addBillingInterval(new Date(paidAt), intent.billingCycle).getTime();

    let record: SubscriptionRecord = {
        userId: intent.userId,
        email: intent.email,
        paystackCustomerId: customerId,
        paystackSubscriptionCode: subscriptionCode || (existing?.paystackSubscriptionCode ?? null),
        paystackPlanCode: getPaystackPlanCode(intent.planId, intent.billingCycle),
        paystackEmailToken: existing?.paystackEmailToken ?? null,
        paystackAuthorizationCode: authorization?.authorizationCode || existing?.paystackAuthorizationCode || null,
        paystackAuthorizationSignature: authorization?.signature || existing?.paystackAuthorizationSignature || null,
        paystackAuthorizationLast4: authorization?.last4 || existing?.paystackAuthorizationLast4 || null,
        planId: intent.planId,
        billingCycle: intent.billingCycle,
        status: "active",
        currentPeriodEnd,
        nextChargeAt: currentPeriodEnd,
        cancelAtPeriodEnd: false,
        lastError: null,
        updatedAt: Date.now(),
    };
    await upsertSubscription(record);

    try {
        if (authorization?.reusable && customerId) {
            const created = await createPaystackSubscription({
                customerId,
                planId: intent.planId,
                billingCycle: intent.billingCycle,
                authorizationCode: authorization.authorizationCode,
                startDate: currentPeriodEnd,
            });
            record = {
                ...record,
                paystackSubscriptionCode: created.subscriptionCode || record.paystackSubscriptionCode || null,
                paystackEmailToken: created.emailToken,
                paystackPlanCode: created.planCode,
                nextChargeAt: created.nextPaymentDate || currentPeriodEnd,
                currentPeriodEnd: created.nextPaymentDate || currentPeriodEnd,
                updatedAt: Date.now(),
            };
            await upsertSubscription(record);
            record = await applyAvailableCreditsToSubscription(record);
        } else {
            await upsertSubscription({
                ...record,
                lastError: "Initial payment succeeded, but automatic renewal still needs a reusable payment method.",
                updatedAt: Date.now(),
            });
        }
        await linkReferralToPurchase(intent);
        await qualifyReferralForFirstPaidCharge(intent.userId, intent.planId, intent.billingCycle, paidAt);
    } catch (error) {
        await upsertSubscription({
            ...record,
            lastError: error instanceof Error ? error.message : "The payment succeeded, but automatic renewal still needs attention.",
            updatedAt: Date.now(),
        });
    }

    await upsertBillingIntent({
        ...intent,
        status: "completed",
        updatedAt: Date.now(),
    });
}

async function resolveBillingIntentForCharge(reference: string | null, metadata: Record<string, unknown>): Promise<BillingIntentRecord | null> {
    const intentByReference = reference ? await getBillingIntentByReference(reference) : null;
    if (intentByReference) return intentByReference;

    const intentId = getMetadataValue(metadata, "intent_id");
    const intentById = await getBillingIntentById(intentId);
    if (!intentById) return null;

    if (reference && intentById.reference !== reference) {
        const updatedIntent: BillingIntentRecord = {
            ...intentById,
            reference,
            status: intentById.status === "pending" ? "checkout_started" : intentById.status,
            updatedAt: Date.now(),
        };
        await upsertBillingIntent(updatedIntent);
        return updatedIntent;
    }

    return intentById;
}

async function processSuccessfulCharge(data: Record<string, unknown>, reference: string | null, existing: SubscriptionRecord | null): Promise<boolean> {
    const metadata = parseMetadata(data.metadata);
    const intent = await resolveBillingIntentForCharge(reference, metadata);
    const billingMode = getMetadataValue(metadata, "billing_mode");

    if (intent) {
        if (intent.status === "pending" || intent.status === "checkout_started" || intent.status === "payment_received") {
            if (isGuestIntentUserId(intent.userId)) {
                return markGuestPurchaseIntentPaymentReceived(intent);
            }
            await handleInitialPurchaseSuccess(data, intent);
            return true;
        }
        return true;
    }

    if (billingMode === "direct_purchase") {
        const metadataPlanId = sanitizePlanId(getMetadataValue(metadata, "plan_id"));
        const metadataCycle = sanitizeBillingCycle(getMetadataValue(metadata, "billing_cycle"));
        const userId = getMetadataValue(metadata, "user_id") || existing?.userId || null;
        const email = getStringFromPaths(data, ["customer.email", "email"]) || existing?.email || null;

        if (!userId || !email || metadataPlanId === "free") {
            return false;
        }

        await handleInitialPurchaseSuccess(data, {
            id: `direct-${reference || userId}`,
            reference: reference || "",
            userId,
            email,
            planId: metadataPlanId,
            billingCycle: metadataCycle,
            referralCode: getMetadataValue(metadata, "referral_code"),
            amountCents: Number(getNestedValue(data, "amount")) || 0,
            status: "payment_received",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return true;
    }

    return handleRecurringChargeSuccess(data, existing);
}

async function handleRecurringChargeSuccess(data: Record<string, unknown>, existing: SubscriptionRecord | null): Promise<boolean> {
    const metadata = parseMetadata(data.metadata);
    const mappedPlan = resolveWebhookPlan({
        metadata,
        planCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]),
    });
    if (!mappedPlan) return false;

    const userId = getMetadataValue(metadata, "user_id") || existing?.userId || null;
    const email = getStringFromPaths(data, ["customer.email", "email"]) || existing?.email || null;
    if (!userId || !email) return false;

    const customerId = getStringFromPaths(data, ["customer.customer_code", "customer_code"]);
    const subscriptionCode = getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]);
    const paidAt = parseTimestamp(getStringFromPaths(data, ["paid_at", "paidAt", "created_at"])) || Date.now();
    const nextPaymentDate =
        parseTimestamp(getStringFromPaths(data, ["next_payment_date", "subscription.next_payment_date"])) ||
        addBillingInterval(new Date(paidAt), mappedPlan.billingCycle).getTime();

    let record: SubscriptionRecord = {
        userId,
        email,
        paystackCustomerId: customerId || existing?.paystackCustomerId || null,
        paystackSubscriptionCode: subscriptionCode || existing?.paystackSubscriptionCode || null,
        paystackPlanCode: getStringFromPaths(data, ["plan.plan_code", "plan_code"]) || existing?.paystackPlanCode || getPaystackPlanCode(mappedPlan.planId, mappedPlan.billingCycle),
        paystackEmailToken: existing?.paystackEmailToken || null,
        paystackAuthorizationCode: extractAuthorization(data)?.authorizationCode || existing?.paystackAuthorizationCode || null,
        paystackAuthorizationSignature: extractAuthorization(data)?.signature || existing?.paystackAuthorizationSignature || null,
        paystackAuthorizationLast4: extractAuthorization(data)?.last4 || existing?.paystackAuthorizationLast4 || null,
        planId: mappedPlan.planId,
        billingCycle: mappedPlan.billingCycle,
        status: "active",
        currentPeriodEnd: nextPaymentDate,
        nextChargeAt: nextPaymentDate,
        cancelAtPeriodEnd: false,
        lastError: null,
        updatedAt: Date.now(),
    };
    await upsertSubscription(record);

    await qualifyReferralForFirstPaidCharge(userId, mappedPlan.planId, mappedPlan.billingCycle, paidAt);
    record = await applyAvailableCreditsToSubscription(record);
    await releaseMaturedCreditsForUser(userId);
    return true;
}

async function handleInvoicePaymentFailed(existing: SubscriptionRecord | null): Promise<boolean> {
    if (!existing) return false;
    await upsertSubscription({
        ...existing,
        status: "past_due",
        lastError: "We could not renew your subscription from the saved card.",
        updatedAt: Date.now(),
    });
    return true;
}

async function handleSubscriptionDisabled(data: Record<string, unknown>, existing: SubscriptionRecord | null): Promise<boolean> {
    if (!existing) return false;
    const incomingSubscriptionCode = getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]);
    if (incomingSubscriptionCode && existing.paystackSubscriptionCode && incomingSubscriptionCode !== existing.paystackSubscriptionCode) {
        return false;
    }

    await upsertSubscription({
        ...existing,
        status: "canceled",
        nextChargeAt: null,
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
    });
    return true;
}

async function handleRefundProcessed(existing: SubscriptionRecord | null): Promise<boolean> {
    if (!existing) return false;

    await upsertSubscription({
        ...existing,
        status: "refunded",
        currentPeriodEnd: Date.now(),
        nextChargeAt: null,
        cancelAtPeriodEnd: true,
        lastError: "The latest payment was refunded.",
        updatedAt: Date.now(),
    });

    const referral = await getReferralByReferee(existing.userId);
    if (referral && referral.status === "qualified_pending_reward") {
        await updateReferral({
            ...referral,
            status: "reversed",
            updatedAt: Date.now(),
        });
        const credits = await getCreditsByReferralId(referral.id);
        for (const credit of credits) {
            if (credit.status === "pending" || credit.status === "available") {
                await updateCredit({
                    ...credit,
                    status: "reversed",
                    updatedAt: Date.now(),
                });
            }
        }
    }
    return true;
}

export async function verifyUserFromRequest(request: Request): Promise<VerifiedUser> {
    const supabase = await createClient();
    const authorization = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

    const authResult = bearerToken
        ? await supabase.auth.getUser(bearerToken)
        : await supabase.auth.getUser();

    const { data: { user }, error } = authResult;

    if (error || !user || !user.email) {
        throw new BillingAuthError("Sign-in is required.");
    }

    return {
        userId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split("@")[0],
    };
}

export async function createCheckoutSession(
    request: Request,
    user: VerifiedUser,
    input: { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle },
): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    const amount = getPlanPrice(input.planId, input.billingCycle);
    if (!amount) {
        throw new BillingError("Pricing is not configured for that plan.", 400);
    }

    return initializePaystackTransaction(request, user, {
        amountCents: amount * 100,
        metadata: {
            billing_mode: "direct_purchase",
            user_id: user.userId,
            plan_id: input.planId,
            billing_cycle: input.billingCycle,
            source: "upgrade_page",
        },
        callbackQuery: {
            mode: "purchase",
        },
    });
}

export async function createAnonymousPurchaseIntent(request: Request, input: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    email: string;
    referralCode?: string | null;
}): Promise<{ reference: string; accessCode: string; amountCents: number }> {
    await ensureBillingSchema();

    const amount = getPlanPrice(input.planId, input.billingCycle);
    if (!amount) {
        throw new BillingError("Pricing is not configured for that plan.", 400);
    }

    const sanitizedReferralCode = sanitizeReferralCode(input.referralCode);
    if (sanitizedReferralCode) {
        const codeRecord = await getReferralCodeByCode(sanitizedReferralCode);
        if (!codeRecord) {
            throw new BillingError("That referral code could not be found.", 404);
        }
    }

    const normalizedEmail = normalizeEmailAddress(input.email);
    const guestUserId = buildGuestIntentUserId();
    const intent: BillingIntentRecord = {
        id: randomUUID(),
        reference: buildBillingReference(guestUserId),
        userId: guestUserId,
        email: normalizedEmail,
        planId: input.planId,
        billingCycle: input.billingCycle,
        referralCode: sanitizedReferralCode,
        amountCents: amount * 100,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    await upsertBillingIntent(intent);

    const checkout = await initializePaystackTransaction(request, {
        userId: guestUserId,
        email: normalizedEmail,
    }, {
        amountCents: intent.amountCents,
        reference: intent.reference,
        metadata: {
            billing_mode: "direct_purchase",
            intent_id: intent.id,
            plan_id: input.planId,
            billing_cycle: input.billingCycle,
            referral_code: sanitizedReferralCode,
            email: normalizedEmail,
        },
        callbackQuery: {
            mode: "purchase",
        },
    });

    await upsertBillingIntent({
        ...intent,
        reference: checkout.reference,
        status: "checkout_started",
        updatedAt: Date.now(),
    });

    return {
        reference: checkout.reference,
        accessCode: checkout.accessCode,
        amountCents: intent.amountCents,
    };
}

export async function getVerifiedEntitlementsForUser(userId: string): Promise<VerifiedEntitlements> {
    await releaseMaturedCreditsForUser(userId);
    const record = await getSubscriptionByColumn("user_id", userId);
    const summary = await buildBillingSummary(userId, record);
    return entitlementsFromSubscription(record, Date.now(), summary);
}

export async function clearSubscriptionLastError(userId: string): Promise<void> {
    await ensureBillingSchema();
    const record = await getSubscriptionByColumn("user_id", userId);
    if (record?.lastError) {
        await upsertSubscription({ ...record, lastError: null, updatedAt: Date.now() });
    }
}

export async function getBillingAccountForUser(userId: string): Promise<BillingAccountResponse> {
    await releaseMaturedCreditsForUser(userId);
    const record = await getSubscriptionByColumn("user_id", userId);
    const summary = await buildBillingSummary(userId, record);
    return {
        entitlements: entitlementsFromSubscription(record, Date.now(), summary),
        account: summary,
    };
}

export async function cancelSubscriptionForUser(userId: string): Promise<BillingAccountResponse> {
    await ensureBillingSchema();
    const record = await getSubscriptionByColumn("user_id", userId);
    if (!record || !record.paystackSubscriptionCode || !record.paystackEmailToken) {
        throw new BillingError("There is no active renewal to cancel.", 404);
    }

    await disablePaystackSubscription(record.paystackSubscriptionCode, record.paystackEmailToken);
    await upsertSubscription({
        ...record,
        status: "canceled",
        nextChargeAt: null,
        cancelAtPeriodEnd: true,
        lastError: null,
        updatedAt: Date.now(),
    });

    return getBillingAccountForUser(userId);
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = createHmac("sha512", getPaystackSecretKey()).update(rawBody).digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function getGuestPaymentStatus(reference: string): Promise<{ paid: boolean; email: string; planId?: string }> {
    const normalizedReference = reference.trim();
    if (!normalizedReference) return { paid: false, email: "" };

    try {
        const response = await paystackRequest<PaystackVerifyTransactionResponse>(
            `/transaction/verify/${encodeURIComponent(normalizedReference)}`,
            { method: "GET" },
        );
        const data = response.data && typeof response.data === "object"
            ? response.data as Record<string, unknown>
            : null;

        if (!data || getStringFromPaths(data, ["status"]) !== "success") {
            return { paid: false, email: "" };
        }

        const metadata = parseMetadata(data.metadata);
        const email = getStringFromPaths(data, ["customer.email", "email"]) || getMetadataValue(metadata, "email") || "";
        const planId = getMetadataValue(metadata, "plan_id") || undefined;

        const intent = await resolveBillingIntentForCharge(normalizedReference, metadata);
        if (intent && (intent.status === "pending" || intent.status === "checkout_started")) {
            await upsertBillingIntent({
                ...intent,
                status: "payment_received",
                updatedAt: Date.now(),
            });
        }

        return { paid: true, email, planId };
    } catch {
        return { paid: false, email: "" };
    }
}

export async function confirmPaystackTransaction(reference: string, user: VerifiedUser): Promise<BillingAccountResponse> {
    await ensureBillingSchema();

    const normalizedReference = reference.trim();
    if (!normalizedReference) {
        throw new BillingError("Payment reference is missing.", 400);
    }

    const response = await paystackRequest<PaystackVerifyTransactionResponse>(
        `/transaction/verify/${encodeURIComponent(normalizedReference)}`,
        { method: "GET" },
    );
    const data = response.data && typeof response.data === "object"
        ? response.data as Record<string, unknown>
        : null;

    if (!data) {
        throw new BillingError("Paystack could not return the payment details.", 502);
    }

    if (getStringFromPaths(data, ["status"]) !== "success") {
        throw new BillingError("Payment is still pending confirmation.", 409);
    }

    const metadata = parseMetadata(data.metadata);
    const intent = await resolveBillingIntentForCharge(normalizedReference, metadata);
    const metadataUserId = getMetadataValue(metadata, "user_id");
    const email = getStringFromPaths(data, ["customer.email", "email"]);

    if (paymentBelongsToDifferentAccount({
        metadataUserId,
        intent,
        paymentEmail: email,
        user,
    })) {
        throw new BillingAuthError("That payment belongs to a different account.");
    }

    const eventKey = buildEventKey("charge.success", { data });
    const canClaimGuestIntent = !!intent
        && isGuestIntentUserId(intent.userId)
        && (intent.status === "pending" || intent.status === "checkout_started" || intent.status === "payment_received");

    if (await hasBillingEvent(eventKey) && !canClaimGuestIntent) {
        return getBillingAccountForUser(user.userId);
    }

    const claimedIntent = intent && (intent.status === "pending" || intent.status === "checkout_started" || intent.status === "payment_received")
        ? await claimGuestPurchaseIntentForUser(intent, user)
        : intent;

    const existing = await resolveExistingSubscription({
        userId: metadataUserId || claimedIntent?.userId || user.userId,
        email: email || claimedIntent?.email || user.email,
        customerId: getStringFromPaths(data, ["customer.customer_code", "customer_code"]),
        subscriptionCode: getStringFromPaths(data, ["subscription.subscription_code", "subscription_code"]),
    });

    const handled = await processSuccessfulCharge(data, normalizedReference, existing);
    if (!handled) {
        throw new BillingError("Payment was verified, but the subscription could not be linked.", 409);
    }

    await markBillingEventProcessed(eventKey, "charge.success", normalizedReference);
    return getBillingAccountForUser(user.userId);
}

export async function processPaystackWebhook(rawBody: string): Promise<{ handled: boolean }> {
    await ensureBillingSchema();
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const event = typeof payload.event === "string" ? payload.event : "";
    if (!event) {
        throw new BillingError("Webhook event missing.", 400);
    }

    const eventKey = buildEventKey(event, payload);
    if (await hasBillingEvent(eventKey)) {
        return { handled: true };
    }

    const data = (payload.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
    const metadata = parseMetadata(data.metadata);
    const reference = getStringFromPaths(data, ["reference"]);
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

    let handled = false;

    if (event === "charge.success") {
        handled = await processSuccessfulCharge(data, reference, existing);
    } else if (event === "invoice.payment_failed") {
        handled = await handleInvoicePaymentFailed(existing);
    } else if (event === "subscription.disable" || event === "subscription.not_renew") {
        handled = await handleSubscriptionDisabled(data, existing);
    } else if (event === "refund.processed") {
        handled = await handleRefundProcessed(existing);
    }

    if (handled) {
        await markBillingEventProcessed(eventKey, event, reference);
    }

    return { handled };
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
