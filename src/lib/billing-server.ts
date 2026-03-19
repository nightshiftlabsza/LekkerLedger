import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { BILLING_CATALOG_KEYS, getBillingCatalogEntry, getBillingCatalogEntryByKey } from "../config/billing-catalog";
import { BillingCycle, PlanId, REFUND_WINDOW_DAYS, getPlanPrice } from "../config/plans";
import {
    addBillingInterval,
    addCalendarMonths,
    BillingCreditRecord,
    BillingCreditStatus,
    BillingIntentKind,
    BillingIntentRecord,
    BillingIssue,
    BillingMoneyCreditRecord,
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
import { PaidActivationState } from "./billing-activation";
import { buildBillingIssue, isPaystackPlanConfigMessage } from "./billing-issues";
import { buildProrationPreview } from "./billing-proration";
import { getRequestAppOrigin } from "./app-origin";
import { env } from "./env";
import { validateConfiguredPaystackPlans, type PaystackPlanValidationSnapshot } from "./paystack-plan-validation";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

type QueryParam = string | number | null;

const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const REFERRAL_REWARD_MONTHS = 1;
const REFERRAL_REWARD_CAP_MONTHS = 12;
const GUEST_INTENT_USER_PREFIX = "guest_";
const ACTIVATION_NONCE_TTL_MS = 15 * 60 * 1000;
export const PAID_ACTIVATION_COOKIE_NAME = "ll-paid-activation";

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

export interface CheckoutSessionResponse {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
    checkoutMode: "inline" | "redirect" | "no_charge";
    proration?: BillingAccountSummary["prorationPreview"];
    billingAccount?: BillingAccountResponse;
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

interface PaystackPlanResponse extends PaystackBasicResponse {
    data?: {
        plan_code?: string;
        amount?: number | string;
        interval?: string;
        currency?: string;
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

interface PaystackChargeAuthorizationResponse extends PaystackBasicResponse {
    data?: Record<string, unknown> & {
        status?: string;
        reference?: string;
        paid_at?: string;
    };
}

interface RenewalRunResult {
    userId: string;
    status: "charged" | "credit_applied" | "failed" | "skipped";
    amountChargedCents: number;
    creditAppliedCents: number;
    message: string;
}

interface PaystackAuthorization {
    authorizationCode: string;
    signature: string | null;
    last4: string | null;
    reusable: boolean;
}

let schemaPromise: Promise<void> | null = null;
let paystackPlanValidationPromise: Promise<PaystackPlanValidationSnapshot> | null = null;
let paystackPlanValidationCachedAt = 0;
const PAYSTACK_PLAN_VALIDATION_TTL_MS = 5 * 60 * 1000;

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
    const planCode = getConfiguredPaystackPlanCodeByEnvVar(getBillingCatalogEntry(planId, billingCycle).envVarName);
    if (!planCode) {
        throw new BillingConfigError(`Paystack plan code missing for ${planId} ${billingCycle}.`);
    }

    return planCode;
}

function getPaystackPlanLookup() {
    return new Map<string, { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle }>(
        BILLING_CATALOG_KEYS
            .map((key) => {
                const entry = getBillingCatalogEntryByKey(key);
                const planCode = getConfiguredPaystackPlanCodeByEnvVar(entry.envVarName);
                if (!planCode) return null;
                return [planCode, { planId: entry.planId, billingCycle: entry.billingCycle }] as const;
            })
            .filter((entry): entry is readonly [string, { planId: Exclude<PlanId, "free">; billingCycle: BillingCycle }] => Boolean(entry)),
    );
}

function getConfiguredPaystackPlanCodeByEnvVar(envVarName: string): string | null {
    const value = process.env[envVarName]?.trim();
    if (!value || value === "undefined" || value === "null") {
        return null;
    }
    return value;
}

function getConfiguredPaystackPlanEnvMap() {
    return Object.fromEntries(
        BILLING_CATALOG_KEYS.map((key) => {
            const entry = getBillingCatalogEntryByKey(key);
            return [entry.envVarName, getConfiguredPaystackPlanCodeByEnvVar(entry.envVarName)];
        }),
    );
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

function hashActivationNonce(nonce: string): string {
    return createHash("sha256").update(nonce).digest("hex");
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
        currentPeriodStart: row.current_period_start === null || row.current_period_start === undefined ? null : Number(row.current_period_start || 0),
        currentPeriodEnd: Number(row.current_period_end || 0),
        nextChargeAt: row.next_charge_at === null || row.next_charge_at === undefined ? null : Number(row.next_charge_at || 0),
        cancelAtPeriodEnd: Boolean(Number(row.cancel_at_period_end || 0)),
        lastError: row.last_error ? String(row.last_error) : null,
        updatedAt: Number(row.updated_at || 0),
    };
}

function rowToBillingIntentRecord(row: Record<string, unknown>): BillingIntentRecord {
    const status = typeof row.status === "string" ? row.status : "pending";

    return {
        id: String(row.id),
        reference: String(row.reference),
        userId: String(row.user_id),
        email: String(row.email),
        planId: sanitizePlanId(String(row.plan_id)) as Exclude<PlanId, "free">,
        billingCycle: sanitizeBillingCycle(String(row.billing_cycle)),
        intentKind: String(row.intent_kind || "new_subscription") as BillingIntentKind,
        currentPlanId: row.current_plan_id ? sanitizePlanId(String(row.current_plan_id)) : null,
        currentBillingCycle: row.current_billing_cycle ? sanitizeBillingCycle(String(row.current_billing_cycle)) : null,
        currentPeriodStart: row.current_period_start === null || row.current_period_start === undefined ? null : Number(row.current_period_start || 0),
        currentPeriodEnd: row.current_period_end === null || row.current_period_end === undefined ? null : Number(row.current_period_end || 0),
        prorationCreditCents: row.proration_credit_cents === null || row.proration_credit_cents === undefined ? null : Number(row.proration_credit_cents || 0),
        nextRecurringAmountCents: row.next_recurring_amount_cents === null || row.next_recurring_amount_cents === undefined ? null : Number(row.next_recurring_amount_cents || 0),
        referralCode: row.referral_code ? String(row.referral_code) : null,
        amountCents: Number(row.amount_cents || 0),
        status: sanitizeBillingIntentStatus(status),
        lastPaymentStatus: row.last_payment_status ? String(row.last_payment_status) : null,
        lastVerifiedAt: row.last_verified_at === null || row.last_verified_at === undefined ? null : Number(row.last_verified_at || 0),
        activationNonceHash: row.activation_nonce_hash ? String(row.activation_nonce_hash) : null,
        activationNonceExpiresAt: row.activation_nonce_expires_at === null || row.activation_nonce_expires_at === undefined ? null : Number(row.activation_nonce_expires_at || 0),
        activationClaimedAt: row.activation_claimed_at === null || row.activation_claimed_at === undefined ? null : Number(row.activation_claimed_at || 0),
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
    const status = typeof row.status === "string" ? row.status : "pending_first_charge";

    return {
        id: String(row.id),
        referrerUserId: String(row.referrer_user_id),
        refereeUserId: String(row.referee_user_id),
        refereeEmail: String(row.referee_email),
        referralCode: String(row.referral_code),
        planId: sanitizePlanId(String(row.plan_id)) as Exclude<PlanId, "free">,
        billingCycle: sanitizeBillingCycle(String(row.billing_cycle)),
        status: sanitizeReferralStatus(status),
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

function rowToBillingMoneyCreditRecord(row: Record<string, unknown>): BillingMoneyCreditRecord {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        sourceIntentId: String(row.source_intent_id),
        amountCents: Number(row.amount_cents || 0),
        status: String(row.status || "available") as BillingMoneyCreditRecord["status"],
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
    schemaPromise ??= (async () => {
        try {
            // Batch all DDL into a single multi-statement D1 call to avoid
            // 15-20 sequential HTTP round-trips (~550 ms each) that can make
            // hosted server runtimes time out on cold starts.
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
                    current_period_start INTEGER,
                    current_period_end INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    paystack_email_token TEXT,
                    paystack_authorization_code TEXT,
                    paystack_authorization_signature TEXT,
                    paystack_authorization_last4 TEXT,
                    next_charge_at INTEGER,
                    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
                    last_error TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(paystack_customer_id);
                CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_code ON subscriptions(paystack_subscription_code);
                CREATE INDEX IF NOT EXISTS idx_subscriptions_authorization_signature ON subscriptions(paystack_authorization_signature);
                CREATE TABLE IF NOT EXISTS billing_intents (
                    id TEXT PRIMARY KEY,
                    reference TEXT NOT NULL UNIQUE,
                    user_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    plan_id TEXT NOT NULL,
                    billing_cycle TEXT NOT NULL,
                    intent_kind TEXT NOT NULL DEFAULT 'new_subscription',
                    current_plan_id TEXT,
                    current_billing_cycle TEXT,
                    current_period_start INTEGER,
                    current_period_end INTEGER,
                    proration_credit_cents INTEGER,
                    next_recurring_amount_cents INTEGER,
                    referral_code TEXT,
                    amount_cents INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    last_payment_status TEXT,
                    last_verified_at INTEGER,
                    activation_nonce_hash TEXT,
                    activation_nonce_expires_at INTEGER,
                    activation_claimed_at INTEGER,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_billing_intents_user_id ON billing_intents(user_id);
                CREATE TABLE IF NOT EXISTS billing_events (
                    event_key TEXT PRIMARY KEY,
                    event_name TEXT NOT NULL,
                    reference TEXT,
                    created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS referral_codes (
                    user_id TEXT PRIMARY KEY,
                    code TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL
                );
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
                );
                CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
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
                );
                CREATE INDEX IF NOT EXISTS idx_billing_credits_user_id ON billing_credits(user_id);
                CREATE TABLE IF NOT EXISTS billing_money_credits (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    source_intent_id TEXT NOT NULL,
                    amount_cents INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_billing_money_credits_user_id ON billing_money_credits(user_id);
                UPDATE subscriptions SET status = 'active' WHERE status = 'trialing';
                UPDATE billing_intents SET status = 'completed' WHERE status = 'trial_started';
                UPDATE referrals SET status = 'pending_first_charge' WHERE status = 'trial_started';
            `);

            // Ensure columns that may be missing on older databases (separate
            // call because ALTER TABLE IF NOT EXISTS is not supported by SQLite).
            await ensureColumns("subscriptions", {
                paystack_email_token: "TEXT",
                paystack_authorization_code: "TEXT",
                paystack_authorization_signature: "TEXT",
                paystack_authorization_last4: "TEXT",
                current_period_start: "INTEGER",
                next_charge_at: "INTEGER",
                cancel_at_period_end: "INTEGER NOT NULL DEFAULT 0",
                last_error: "TEXT",
            });
            await ensureColumns("billing_intents", {
                intent_kind: "TEXT NOT NULL DEFAULT 'new_subscription'",
                current_plan_id: "TEXT",
                current_billing_cycle: "TEXT",
                current_period_start: "INTEGER",
                current_period_end: "INTEGER",
                proration_credit_cents: "INTEGER",
                next_recurring_amount_cents: "INTEGER",
                last_payment_status: "TEXT",
                last_verified_at: "INTEGER",
                activation_nonce_hash: "TEXT",
                activation_nonce_expires_at: "INTEGER",
                activation_claimed_at: "INTEGER",
            });
            await ensureColumns("billing_money_credits", {
                source_intent_id: "TEXT",
                amount_cents: "INTEGER",
                status: "TEXT",
                created_at: "INTEGER",
                updated_at: "INTEGER",
            });
            await queryD1(
                `
                    UPDATE subscriptions
                    SET current_period_start = CASE
                        WHEN current_period_start IS NOT NULL THEN current_period_start
                        WHEN billing_cycle = 'monthly' THEN CAST(strftime('%s', datetime(current_period_end / 1000, 'unixepoch', '-1 month')) AS INTEGER) * 1000
                        ELSE CAST(strftime('%s', datetime(current_period_end / 1000, 'unixepoch', '-1 year')) AS INTEGER) * 1000
                    END
                    WHERE current_period_end IS NOT NULL
                `,
            );
        } catch (error) {
            // Reset the singleton so the next call retries instead of
            // permanently caching a rejected promise ("poisoned singleton").
            schemaPromise = null;
            throw error;
        }
    })();

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
            ...init.headers,
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

async function fetchPaystackPlanDefinition(planCode: string): Promise<PaystackPlanResponse> {
    return paystackRequest<PaystackPlanResponse>(`/plan/${encodeURIComponent(planCode)}`, { method: "GET" });
}

async function getPaystackPlanValidationSnapshot(force = false): Promise<PaystackPlanValidationSnapshot> {
    if (!force && paystackPlanValidationPromise && (Date.now() - paystackPlanValidationCachedAt) < PAYSTACK_PLAN_VALIDATION_TTL_MS) {
        return paystackPlanValidationPromise;
    }

    paystackPlanValidationCachedAt = Date.now();
    paystackPlanValidationPromise = validateConfiguredPaystackPlans(getConfiguredPaystackPlanEnvMap(), fetchPaystackPlanDefinition);
    const snapshot = await paystackPlanValidationPromise;

    if (!snapshot.ok) {
        console.error("[Billing] Paystack plan validation failed.", snapshot.issues);
    }

    return snapshot;
}

async function assertConfiguredPaystackPlansValid(): Promise<void> {
    const snapshot = await getPaystackPlanValidationSnapshot(true);
    if (snapshot.ok) {
        return;
    }

    const firstIssue = snapshot.issues[0];
    throw new BillingConfigError(
        `Paystack plan validation failed for ${firstIssue?.envVarName || "billing config"}. Check Railway LIVE plan mappings before retrying checkout.`,
    );
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

    // Release UNIQUE Paystack identifiers that belong to a *different* user_id
    // so the upsert below doesn't hit a SQLITE_CONSTRAINT on the UNIQUE columns.
    // This happens when the same person checks out from two different auth
    // providers (e.g. Google OAuth vs email/password) — Paystack sees the same
    // customer but the app has separate subscription rows.
    const uniquePaystackColumns: Array<[string, string | null | undefined]> = [
        ["paystack_customer_id", record.paystackCustomerId],
        ["paystack_subscription_code", record.paystackSubscriptionCode],
        ["paystack_authorization_signature", record.paystackAuthorizationSignature],
    ];
    for (const [column, value] of uniquePaystackColumns) {
        if (value) {
            await queryD1(
                `UPDATE subscriptions SET ${column} = NULL WHERE ${column} = ? AND user_id != ?`,
                [value, record.userId],
            );
        }
    }

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
                current_period_start,
                current_period_end,
                next_charge_at,
                cancel_at_period_end,
                last_error,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                current_period_start = excluded.current_period_start,
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
            record.currentPeriodStart ?? null,
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
                intent_kind,
                current_plan_id,
                current_billing_cycle,
                current_period_start,
                current_period_end,
                proration_credit_cents,
                next_recurring_amount_cents,
                referral_code,
                amount_cents,
                status,
                last_payment_status,
                last_verified_at,
                activation_nonce_hash,
                activation_nonce_expires_at,
                activation_claimed_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                reference = excluded.reference,
                user_id = excluded.user_id,
                email = excluded.email,
                plan_id = excluded.plan_id,
                billing_cycle = excluded.billing_cycle,
                intent_kind = excluded.intent_kind,
                current_plan_id = excluded.current_plan_id,
                current_billing_cycle = excluded.current_billing_cycle,
                current_period_start = excluded.current_period_start,
                current_period_end = excluded.current_period_end,
                proration_credit_cents = excluded.proration_credit_cents,
                next_recurring_amount_cents = excluded.next_recurring_amount_cents,
                referral_code = excluded.referral_code,
                amount_cents = excluded.amount_cents,
                status = excluded.status,
                last_payment_status = excluded.last_payment_status,
                last_verified_at = excluded.last_verified_at,
                activation_nonce_hash = excluded.activation_nonce_hash,
                activation_nonce_expires_at = excluded.activation_nonce_expires_at,
                activation_claimed_at = excluded.activation_claimed_at,
                updated_at = excluded.updated_at
        `,
        [
            record.id,
            record.reference,
            record.userId,
            record.email,
            record.planId,
            record.billingCycle,
            record.intentKind ?? "new_subscription",
            record.currentPlanId ?? null,
            record.currentBillingCycle ?? null,
            record.currentPeriodStart ?? null,
            record.currentPeriodEnd ?? null,
            record.prorationCreditCents ?? null,
            record.nextRecurringAmountCents ?? null,
            record.referralCode ?? null,
            record.amountCents,
            record.status,
            record.lastPaymentStatus ?? null,
            record.lastVerifiedAt ?? null,
            record.activationNonceHash ?? null,
            record.activationNonceExpiresAt ?? null,
            record.activationClaimedAt ?? null,
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
        const code = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
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

async function getMoneyCreditsForUser(userId: string): Promise<BillingMoneyCreditRecord[]> {
    await ensureBillingSchema();
    const rows = await queryD1("SELECT * FROM billing_money_credits WHERE user_id = ?", [userId]);
    return rows.map(rowToBillingMoneyCreditRecord);
}

async function insertMoneyCredit(record: BillingMoneyCreditRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            INSERT INTO billing_money_credits (
                id,
                user_id,
                source_intent_id,
                amount_cents,
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            record.id,
            record.userId,
            record.sourceIntentId,
            record.amountCents,
            record.status,
            record.createdAt,
            record.updatedAt,
        ],
    );
}

async function updateMoneyCredit(record: BillingMoneyCreditRecord): Promise<void> {
    await ensureBillingSchema();
    await queryD1(
        `
            UPDATE billing_money_credits
            SET amount_cents = ?, status = ?, updated_at = ?
            WHERE id = ?
        `,
        [
            record.amountCents,
            record.status,
            record.updatedAt,
            record.id,
        ],
    );
}

async function summarizeMoneyCreditsForUser(userId: string) {
    const credits = await getMoneyCreditsForUser(userId);
    return credits.reduce(
        (summary, credit) => {
            if (credit.status === "available") summary.available += credit.amountCents;
            if (credit.status === "applied") summary.applied += credit.amountCents;
            return summary;
        },
        { available: 0, applied: 0 },
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
}): Promise<{ authorizationUrl: string; accessCode: string; reference: string; checkoutMode: "inline" | "redirect" }> {
    const origin = getRequestAppOrigin(request);
    const reference = input.reference || buildBillingReference(user.userId);
    const callbackUrl = new URL(`${origin}/billing/activate`);
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
            metadata: input.metadata,
        }),
    });

    if (!response.data?.authorization_url || !response.data.reference) {
        throw new BillingError(response.message || "Paystack checkout could not be started.", 502);
    }

    return {
        authorizationUrl: response.data.authorization_url,
        accessCode: response.data.access_code || "",
        reference: response.data.reference,
        checkoutMode: response.data.access_code ? "inline" : "redirect",
    };
}

async function createPaystackSubscription(input: {
    customerId: string;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    authorizationCode: string;
    startDate: number;
}): Promise<{ subscriptionCode: string; emailToken: string | null; nextPaymentDate: number | null; planCode: string }> {
    await assertConfiguredPaystackPlansValid();
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
        currentPeriodStart: baseChargeAt,
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
    const moneyCreditSummary = await summarizeMoneyCreditsForUser(userId);
    const successfulReferralCount = await countSuccessfulReferrals(userId);
    const planValidationSnapshot = await getPaystackPlanValidationSnapshot().catch(() => ({
        ok: false,
        issues: [{
            key: getBillingCatalogEntry("standard", "monthly").key,
            envVarName: getBillingCatalogEntry("standard", "monthly").envVarName,
            planCode: getConfiguredPaystackPlanCodeByEnvVar(getBillingCatalogEntry("standard", "monthly").envVarName),
            message: "Paystack plan validation failed.",
        }],
    }));
    const activePaidRecord = record && isPaidPlanId(record.planId) ? record : null;
    const configuredPlanEntry = activePaidRecord ? getBillingCatalogEntry(activePaidRecord.planId as Exclude<PlanId, "free">, activePaidRecord.billingCycle) : null;
    const planValidationIssue = configuredPlanEntry
        ? planValidationSnapshot.issues.find((issue) => issue.envVarName === configuredPlanEntry.envVarName)
        : undefined;
    const normalizedLastError = !planValidationIssue && isPaystackPlanConfigMessage(record?.lastError)
        ? null
        : record?.lastError || null;
    const issue = buildBillingIssue({
        lastError: normalizedLastError,
        hasPlanValidationIssue: Boolean(planValidationIssue),
        planValidationMessage: planValidationIssue?.message || null,
        usesManualRenewalAdjustment: moneyCreditSummary.available > 0,
    });
    const nextChargeAt = toIso(record?.nextChargeAt ?? record?.currentPeriodEnd);
    const recurringAmountCents = activePaidRecord
        ? getBillingCatalogEntry(activePaidRecord.planId as Exclude<PlanId, "free">, activePaidRecord.billingCycle).amountCents
        : 0;
    const nextChargeAmountCents = Math.max(0, recurringAmountCents - moneyCreditSummary.available);

    return {
        referralCode: referralCode.code,
        nextChargeAt,
        cancelAtPeriodEnd: Boolean(record?.cancelAtPeriodEnd),
        availableReferralMonths: creditSummary.available,
        pendingReferralMonths: creditSummary.pending,
        successfulReferralCount,
        totalReferralMonthsEarned: creditSummary.total,
        issue,
        upcomingCharge: nextChargeAt && recurringAmountCents > 0 ? {
            dueAt: nextChargeAt,
            amountCents: nextChargeAmountCents,
            currency: "ZAR",
            source: moneyCreditSummary.available > 0 ? "manual_with_credit" : "plan",
        } : undefined,
        availableMoneyCreditCents: moneyCreditSummary.available,
        lastError: issue?.customerMessage || normalizedLastError || undefined,
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
            lastPaymentStatus: "success",
            lastVerifiedAt: Date.now(),
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
    if (referral?.status !== "pending_first_charge") return;

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
        currentPeriodStart: paidAt,
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
                currentPeriodStart: paidAt,
                nextChargeAt: created.nextPaymentDate || currentPeriodEnd,
                currentPeriodEnd: created.nextPaymentDate || currentPeriodEnd,
                updatedAt: Date.now(),
            };
            await upsertSubscription(record);
            await applyAvailableCreditsToSubscription(record);
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
        lastPaymentStatus: "success",
        lastVerifiedAt: Date.now(),
        updatedAt: Date.now(),
    });
}

async function hasMoneyCreditForIntent(intentId: string): Promise<boolean> {
    await ensureBillingSchema();
    const rows = await queryD1(
        "SELECT id FROM billing_money_credits WHERE source_intent_id = ? LIMIT 1",
        [intentId],
    );
    return rows.length > 0;
}

async function createMoneyCreditForIntent(userId: string, intentId: string, amountCents: number): Promise<void> {
    if (amountCents <= 0 || await hasMoneyCreditForIntent(intentId)) {
        return;
    }

    await insertMoneyCredit({
        id: randomUUID(),
        userId,
        sourceIntentId: intentId,
        amountCents,
        status: "available",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
}

async function consumeMoneyCredits(userId: string, amountCents: number, appliedAt: number): Promise<number> {
    if (amountCents <= 0) {
        return 0;
    }

    const credits = (await getMoneyCreditsForUser(userId))
        .filter((credit) => credit.status === "available" && credit.amountCents > 0)
        .sort((left, right) => left.createdAt - right.createdAt);

    let remainingToApply = amountCents;
    let appliedCents = 0;

    for (const credit of credits) {
        if (remainingToApply <= 0) {
            break;
        }

        const appliedFromCredit = Math.min(credit.amountCents, remainingToApply);
        const remainingCredit = credit.amountCents - appliedFromCredit;
        appliedCents += appliedFromCredit;
        remainingToApply -= appliedFromCredit;

        await updateMoneyCredit({
            ...credit,
            amountCents: remainingCredit,
            status: remainingCredit > 0 ? "available" : "applied",
            updatedAt: appliedAt,
        });
    }

    return appliedCents;
}

function buildRenewalReference(userId: string): string {
    return `renewal_${userId}_${Date.now()}`;
}

async function chargePaystackAuthorization(input: {
    userId: string;
    email: string;
    amountCents: number;
    authorizationCode: string;
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
}): Promise<Record<string, unknown>> {
    const reference = buildRenewalReference(input.userId);
    const response = await paystackRequest<PaystackChargeAuthorizationResponse>("/transaction/charge_authorization", {
        method: "POST",
        body: JSON.stringify({
            email: input.email,
            amount: input.amountCents,
            authorization_code: input.authorizationCode,
            reference,
            currency: "ZAR",
            metadata: {
                billing_mode: "manual_renewal_adjustment",
                user_id: input.userId,
                plan_id: input.planId,
                billing_cycle: input.billingCycle,
                source: "billing_renewal_worker",
            },
        }),
    });

    const data = response.data && typeof response.data === "object"
        ? response.data as Record<string, unknown>
        : null;
    if (!data || getStringFromPaths(data, ["status"]) !== "success") {
        throw new BillingError(
            response.message || "Paystack could not complete the renewal charge from the saved payment method.",
            409,
        );
    }

    return data;
}

function getExistingCurrentPeriodStart(record: SubscriptionRecord, fallbackEnd: number): number {
    if (record.currentPeriodStart && record.currentPeriodStart > 0) {
        return record.currentPeriodStart;
    }

    const backfilled = record.billingCycle === "monthly"
        ? new Date(new Date(fallbackEnd).setMonth(new Date(fallbackEnd).getMonth() - 1)).getTime()
        : new Date(new Date(fallbackEnd).setFullYear(new Date(fallbackEnd).getFullYear() - 1)).getTime();
    return backfilled;
}

async function handlePlanChangeSuccess(
    data: Record<string, unknown>,
    intent: BillingIntentRecord,
    existing: SubscriptionRecord | null,
): Promise<void> {
    if (!existing || !isPaidPlanId(existing.planId) || existing.currentPeriodEnd <= Date.now()) {
        throw new BillingError("There is no active paid subscription to change.", 409);
    }

    const authorization = extractAuthorization(data);
    const customerId = getStringFromPaths(data, ["customer.customer_code", "customer_code"]) || existing.paystackCustomerId || null;
    const authorizationCode = authorization?.authorizationCode || existing.paystackAuthorizationCode || null;
    if (!customerId || !authorizationCode) {
        throw new BillingError("We need to refresh your saved payment method before changing plans.", 409);
    }

    if (existing.paystackSubscriptionCode && existing.paystackEmailToken) {
        await disablePaystackSubscription(existing.paystackSubscriptionCode, existing.paystackEmailToken);
    }

    const now = Date.now();
    const currentPeriodEnd = intent.currentPeriodEnd || existing.currentPeriodEnd;
    const currentPeriodStart = intent.currentPeriodStart || getExistingCurrentPeriodStart(existing, currentPeriodEnd);
    const targetChargeCents = Math.round((intent.nextRecurringAmountCents ?? 0) * (buildProrationPreview({
        currentPlanId: (intent.currentPlanId === "standard" || intent.currentPlanId === "pro") ? intent.currentPlanId : existing.planId as Exclude<PlanId, "free">,
        currentBillingCycle: intent.currentBillingCycle ?? existing.billingCycle,
        targetPlanId: intent.planId,
        targetBillingCycle: intent.billingCycle,
        currentPeriodStart,
        currentPeriodEnd,
        now,
    }).remainingFraction));
    const excessCreditCents = Math.max(0, (intent.prorationCreditCents ?? 0) - targetChargeCents);

    let nextChargeAt = currentPeriodEnd;
    let paystackSubscriptionCode: string | null = null;
    let paystackEmailToken: string | null = null;
    let paystackPlanCode = getPaystackPlanCode(intent.planId, intent.billingCycle);
    let lastError: string | null = null;

    if (excessCreditCents <= 0) {
        try {
            const created = await createPaystackSubscription({
                customerId,
                planId: intent.planId,
                billingCycle: intent.billingCycle,
                authorizationCode,
                startDate: currentPeriodEnd,
            });
            paystackSubscriptionCode = created.subscriptionCode || paystackSubscriptionCode;
            paystackEmailToken = created.emailToken;
            paystackPlanCode = created.planCode;
            nextChargeAt = created.nextPaymentDate || currentPeriodEnd;
        } catch (error) {
            lastError = error instanceof Error ? error.message : "The plan changed, but renewal setup still needs attention.";
        }
    }

    await createMoneyCreditForIntent(intent.userId, intent.id, excessCreditCents);

    await upsertSubscription({
        ...existing,
        userId: intent.userId,
        email: intent.email,
        paystackCustomerId: customerId,
        paystackSubscriptionCode,
        paystackPlanCode,
        paystackEmailToken,
        paystackAuthorizationCode: authorizationCode,
        paystackAuthorizationSignature: authorization?.signature || existing.paystackAuthorizationSignature || null,
        paystackAuthorizationLast4: authorization?.last4 || existing.paystackAuthorizationLast4 || null,
        planId: intent.planId,
        billingCycle: intent.billingCycle,
        status: "active",
        currentPeriodStart,
        currentPeriodEnd,
        nextChargeAt,
        cancelAtPeriodEnd: false,
        lastError,
        updatedAt: now,
    });

    await upsertBillingIntent({
        ...intent,
        status: "completed",
        lastPaymentStatus: "success",
        lastVerifiedAt: now,
        updatedAt: now,
    });
}

async function listSubscriptionsDueForManualRenewal(referenceTime: number): Promise<SubscriptionRecord[]> {
    await ensureBillingSchema();
    const rows = await queryD1(
        `
            SELECT *
            FROM subscriptions
            WHERE plan_id != 'free'
              AND next_charge_at IS NOT NULL
              AND next_charge_at <= ?
              AND status IN ('active', 'past_due')
            ORDER BY next_charge_at ASC
        `,
        [referenceTime],
    );
    return rows.map(rowToSubscriptionRecord);
}

async function restoreScheduledRenewalSubscription(
    record: SubscriptionRecord,
    customerId: string,
    authorizationCode: string,
    startDate: number,
): Promise<Pick<SubscriptionRecord, "paystackSubscriptionCode" | "paystackEmailToken" | "paystackPlanCode" | "nextChargeAt" | "lastError">> {
    try {
        const created = await createPaystackSubscription({
            customerId,
            planId: record.planId as Exclude<PlanId, "free">,
            billingCycle: record.billingCycle,
            authorizationCode,
            startDate,
        });

        return {
            paystackSubscriptionCode: created.subscriptionCode || null,
            paystackEmailToken: created.emailToken,
            paystackPlanCode: created.planCode,
            nextChargeAt: created.nextPaymentDate || startDate,
            lastError: null,
        };
    } catch (error) {
        return {
            paystackSubscriptionCode: null,
            paystackEmailToken: null,
            paystackPlanCode: record.paystackPlanCode || null,
            nextChargeAt: startDate,
            lastError: error instanceof Error
                ? error.message
                : "Renewal was applied, but the next automatic renewal still needs billing attention.",
        };
    }
}

async function processManualRenewalAdjustment(record: SubscriptionRecord, availableCreditCents: number, referenceTime: number): Promise<RenewalRunResult> {
    if (!isPaidPlanId(record.planId)) {
        return {
            userId: record.userId,
            status: "skipped",
            amountChargedCents: 0,
            creditAppliedCents: 0,
            message: "Free plans do not need manual renewal handling.",
        };
    }

    const recurringAmountCents = getBillingCatalogEntry(record.planId as Exclude<PlanId, "free">, record.billingCycle).amountCents;
    if (recurringAmountCents <= 0) {
        return {
            userId: record.userId,
            status: "skipped",
            amountChargedCents: 0,
            creditAppliedCents: 0,
            message: "Recurring amount is not configured.",
        };
    }

    const renewalStart = record.nextChargeAt ?? record.currentPeriodEnd ?? referenceTime;
    const renewalEnd = addBillingInterval(new Date(renewalStart), record.billingCycle).getTime();
    const amountToChargeCents = Math.max(0, recurringAmountCents - availableCreditCents);
    const creditToApplyCents = Math.min(availableCreditCents, recurringAmountCents);
    const now = Date.now();

    try {
        let chargeData: Record<string, unknown> | null = null;
        if (amountToChargeCents > 0) {
            if (!record.paystackAuthorizationCode) {
                throw new BillingError("A saved payment method is required before we can charge the discounted renewal.", 409);
            }

            chargeData = await chargePaystackAuthorization({
                userId: record.userId,
                email: record.email,
                amountCents: amountToChargeCents,
                authorizationCode: record.paystackAuthorizationCode,
                planId: record.planId as Exclude<PlanId, "free">,
                billingCycle: record.billingCycle,
            });
        }

        const appliedCredits = await consumeMoneyCredits(record.userId, creditToApplyCents, now);
        const remainingCredits = await summarizeMoneyCreditsForUser(record.userId);
        let restoredRenewal: Pick<SubscriptionRecord, "paystackSubscriptionCode" | "paystackEmailToken" | "paystackPlanCode" | "nextChargeAt" | "lastError"> = {
            paystackSubscriptionCode: null,
            paystackEmailToken: null,
            paystackPlanCode: getPaystackPlanCode(record.planId as Exclude<PlanId, "free">, record.billingCycle),
            nextChargeAt: renewalEnd,
            lastError: null,
        };

        if (remainingCredits.available <= 0 && record.paystackCustomerId && record.paystackAuthorizationCode) {
            restoredRenewal = await restoreScheduledRenewalSubscription(
                record,
                record.paystackCustomerId,
                record.paystackAuthorizationCode,
                renewalEnd,
            );
        }

        await upsertSubscription({
            ...record,
            paystackSubscriptionCode: restoredRenewal.paystackSubscriptionCode,
            paystackEmailToken: restoredRenewal.paystackEmailToken,
            paystackPlanCode: restoredRenewal.paystackPlanCode,
            status: "active",
            currentPeriodStart: renewalStart,
            currentPeriodEnd: renewalEnd,
            nextChargeAt: restoredRenewal.nextChargeAt,
            cancelAtPeriodEnd: false,
            lastError: restoredRenewal.lastError,
            updatedAt: now,
            paystackAuthorizationCode: extractAuthorization(chargeData || {})?.authorizationCode || record.paystackAuthorizationCode || null,
            paystackAuthorizationSignature: extractAuthorization(chargeData || {})?.signature || record.paystackAuthorizationSignature || null,
            paystackAuthorizationLast4: extractAuthorization(chargeData || {})?.last4 || record.paystackAuthorizationLast4 || null,
        });

        return {
            userId: record.userId,
            status: amountToChargeCents > 0 ? "charged" : "credit_applied",
            amountChargedCents: amountToChargeCents,
            creditAppliedCents: appliedCredits,
            message: amountToChargeCents > 0
                ? "Manual renewal charge completed and the next recurring renewal was rescheduled."
                : "Account credit covered this renewal and the subscription period was extended.",
        };
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : "The saved payment method could not be used for the discounted renewal.";

        await upsertSubscription({
            ...record,
            status: "past_due",
            lastError: message,
            updatedAt: now,
        });

        return {
            userId: record.userId,
            status: "failed",
            amountChargedCents: 0,
            creditAppliedCents: 0,
            message,
        };
    }
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
            if (intent.intentKind === "plan_change") {
                await handlePlanChangeSuccess(data, intent, existing);
            } else {
                await handleInitialPurchaseSuccess(data, intent);
            }
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

    const record: SubscriptionRecord = {
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
        currentPeriodStart: paidAt,
        currentPeriodEnd: nextPaymentDate,
        nextChargeAt: nextPaymentDate,
        cancelAtPeriodEnd: false,
        lastError: null,
        updatedAt: Date.now(),
    };
    await upsertSubscription(record);

    await qualifyReferralForFirstPaidCharge(userId, mappedPlan.planId, mappedPlan.billingCycle, paidAt);
    await applyAvailableCreditsToSubscription(record);
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
    if (referral?.status === "qualified_pending_reward") {
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

type ActivationProfileState = {
    keySetupComplete: boolean;
    encryptionMode: string | null;
};

type ActivationResolvedUser = {
    id: string;
    email: string;
};

type ActivationResolution = {
    state: PaidActivationState;
    activationNonce: string | null;
};

type PaymentSnapshot = {
    reference: string;
    intent: BillingIntentRecord | null;
    paymentStatus: string | null;
    email: string;
    planId?: Exclude<PlanId, "free">;
    billingCycle?: BillingCycle;
    paid: boolean;
};

async function findAuthUserByEmail(email: string): Promise<ActivationResolvedUser | null> {
    const normalizedEmail = normalizeEmailAddress(email);
    const admin = createAdminClient();
    let page = 1;

    while (page <= 20) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
            throw new BillingError(error.message, 502);
        }

        const users = data?.users ?? [];
        const match = users.find((user) => normalizeEmailAddress(user.email || "") === normalizedEmail);
        if (match?.id && match.email) {
            return {
                id: match.id,
                email: match.email,
            };
        }

        if (users.length < 1000) {
            break;
        }

        page += 1;
    }

    return null;
}

async function getActivationProfileState(userId: string): Promise<ActivationProfileState | null> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("user_profiles")
        .select("key_setup_complete, encryption_mode")
        .eq("id", userId)
        .maybeSingle<{ key_setup_complete?: boolean | null; encryption_mode?: string | null }>();

    if (error) {
        throw new BillingError(error.message, 502);
    }

    if (!data) {
        return null;
    }

    return {
        keySetupComplete: Boolean(data.key_setup_complete),
        encryptionMode: typeof data.encryption_mode === "string" ? data.encryption_mode : null,
    };
}

async function issueActivationNonce(intent: BillingIntentRecord): Promise<string> {
    const nonce = `${randomUUID()}${randomUUID().replaceAll("-", "")}`;
    await upsertBillingIntent({
        ...intent,
        activationNonceHash: hashActivationNonce(nonce),
        activationNonceExpiresAt: Date.now() + ACTIVATION_NONCE_TTL_MS,
        updatedAt: Date.now(),
    });
    return nonce;
}

async function clearActivationNonce(reference: string): Promise<void> {
    const intent = await getBillingIntentByReference(reference);
    if (!intent || (!intent.activationNonceHash && !intent.activationNonceExpiresAt)) {
        return;
    }

    await upsertBillingIntent({
        ...intent,
        activationNonceHash: null,
        activationNonceExpiresAt: null,
        updatedAt: Date.now(),
    });
}

async function validateActivationNonce(reference: string, nonce: string): Promise<BillingIntentRecord | null> {
    const intent = await getBillingIntentByReference(reference);
    if (!intent?.activationNonceHash || !intent.activationNonceExpiresAt || intent.activationNonceExpiresAt < Date.now()) {
        return null;
    }

    if (hashActivationNonce(nonce) !== intent.activationNonceHash) {
        return null;
    }

    return intent;
}

async function markActivationClaimed(intent: BillingIntentRecord, user: VerifiedUser): Promise<BillingIntentRecord> {
    const latestIntent = await getBillingIntentById(intent.id) || await getBillingIntentByReference(intent.reference) || intent;
    const claimedIntent: BillingIntentRecord = {
        ...latestIntent,
        userId: user.userId,
        email: user.email,
        activationClaimedAt: latestIntent.activationClaimedAt ?? Date.now(),
        activationNonceHash: null,
        activationNonceExpiresAt: null,
        updatedAt: Date.now(),
    };
    await upsertBillingIntent(claimedIntent);
    return claimedIntent;
}

async function fetchPaymentSnapshot(reference: string): Promise<PaymentSnapshot> {
    await ensureBillingSchema();

    const normalizedReference = reference.trim();
    const intent = normalizedReference ? await getBillingIntentByReference(normalizedReference) : null;
    if (!normalizedReference) {
        return {
            reference: "",
            intent: null,
            paymentStatus: null,
            email: "",
            paid: false,
        };
    }

    let paymentStatus: string | null = null;
    let email = intent?.email || "";
    let planId = intent?.planId;
    let billingCycle = intent?.billingCycle;

    try {
        const response = await paystackRequest<PaystackVerifyTransactionResponse>(
            `/transaction/verify/${encodeURIComponent(normalizedReference)}`,
            { method: "GET" },
        );
        const data = response.data && typeof response.data === "object"
            ? response.data as Record<string, unknown>
            : null;

        if (data) {
            paymentStatus = getStringFromPaths(data, ["status"]);
            const metadata = parseMetadata(data.metadata);
            email = getStringFromPaths(data, ["customer.email", "email"]) || getMetadataValue(metadata, "email") || email;

            const metadataPlanId = sanitizePlanId(getMetadataValue(metadata, "plan_id"));
            if (metadataPlanId !== "free") {
                planId = metadataPlanId;
            }

            const metadataBillingCycle = getMetadataValue(metadata, "billing_cycle");
            if (metadataBillingCycle === "monthly" || metadataBillingCycle === "yearly") {
                billingCycle = metadataBillingCycle;
            }

            const resolvedIntent = await resolveBillingIntentForCharge(normalizedReference, metadata);
            const targetIntent = resolvedIntent || intent;
            if (targetIntent) {
                let nextStatus = targetIntent.status;
                if (paymentStatus === "success" && (nextStatus === "pending" || nextStatus === "checkout_started")) {
                    nextStatus = "payment_received";
                } else if ((paymentStatus === "abandoned" || paymentStatus === "cancelled") && nextStatus !== "completed") {
                    nextStatus = "canceled";
                } else if ((paymentStatus === "failed" || paymentStatus === "reversed") && nextStatus !== "completed") {
                    nextStatus = "rejected";
                }

                await upsertBillingIntent({
                    ...targetIntent,
                    status: nextStatus,
                    lastPaymentStatus: paymentStatus,
                    lastVerifiedAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }
    } catch {
        paymentStatus = intent?.lastPaymentStatus || null;
    }

    const paid = paymentStatus === "success"
        || intent?.status === "payment_received"
        || intent?.status === "completed";

    return {
        reference: normalizedReference,
        intent: await getBillingIntentByReference(normalizedReference),
        paymentStatus,
        email,
        planId,
        billingCycle,
        paid,
    };
}

function buildActivationState(input: {
    reference: string;
    email: string;
    planId?: Exclude<PlanId, "free">;
    billingCycle?: BillingCycle;
    status: PaidActivationState["status"];
}): PaidActivationState {
    return {
        status: input.status,
        reference: input.reference,
        email: input.email,
        planId: input.planId,
        billingCycle: input.billingCycle,
    };
}

async function resolvePaidActivationInternal(reference: string, user: VerifiedUser | null): Promise<ActivationResolution> {
    const snapshot = await fetchPaymentSnapshot(reference);
    const intent = snapshot.intent;
    const email = snapshot.email || intent?.email || user?.email || "";
    const planId = snapshot.planId || intent?.planId;
    const billingCycle = snapshot.billingCycle || intent?.billingCycle;

    if (!snapshot.reference) {
        return {
            state: buildActivationState({
                status: "payment_failed_or_unpaid",
                reference: "",
                email,
                planId,
                billingCycle,
            }),
            activationNonce: null,
        };
    }

    if (!snapshot.paid) {
        const failedStatuses = new Set(["failed", "reversed"]);
        const cancelledStatuses = new Set(["abandoned", "cancelled"]);
        const resolvedStatus = cancelledStatuses.has(snapshot.paymentStatus || "") || intent?.status === "canceled"
            ? "payment_cancelled_or_abandoned"
            : failedStatuses.has(snapshot.paymentStatus || "") || intent?.status === "rejected"
                ? "payment_failed_or_unpaid"
                : "pending_payment";

        return {
            state: buildActivationState({
                status: resolvedStatus,
                reference: snapshot.reference,
                email,
                planId,
                billingCycle,
            }),
            activationNonce: null,
        };
    }

    const authUser = email ? await findAuthUserByEmail(email) : null;
    const existingSubscription = await resolveExistingSubscription({
        userId: authUser?.id || user?.userId || intent?.userId,
        email,
    });
    const hasActivePaidSubscription = Boolean(
        existingSubscription
        && existingSubscription.planId !== "free"
        && existingSubscription.status === "active"
        && existingSubscription.currentPeriodEnd > Date.now(),
    );

    if (hasActivePaidSubscription) {
        return {
            state: buildActivationState({
                status: "already_active",
                reference: snapshot.reference,
                email,
                planId,
                billingCycle,
            }),
            activationNonce: null,
        };
    }

    if (!authUser) {
        const activationNonce = intent ? await issueActivationNonce(intent) : null;
        return {
            state: buildActivationState({
                status: "payment_verified_new_user",
                reference: snapshot.reference,
                email,
                planId,
                billingCycle,
            }),
            activationNonce,
        };
    }

    const profile = await getActivationProfileState(authUser.id);
    const isSignedInMatch = Boolean(
        user
        && user.userId === authUser.id
        && normalizeEmailAddress(user.email) === normalizeEmailAddress(authUser.email),
    );

    const status: PaidActivationState["status"] = isSignedInMatch
        ? profile?.keySetupComplete
            ? "payment_verified_existing_unlock"
            : "payment_verified_existing_continue_setup"
        : profile?.keySetupComplete
            ? "payment_verified_existing_login"
            : "payment_verified_existing_continue_setup";

    return {
        state: buildActivationState({
            status,
            reference: snapshot.reference,
            email,
            planId,
            billingCycle,
        }),
        activationNonce: null,
    };
}

export async function verifyUserFromRequest(request: Request): Promise<VerifiedUser> {
    const supabase = await createClient();
    const authorization = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

    const authResult = bearerToken
        ? await supabase.auth.getUser(bearerToken)
        : await supabase.auth.getUser();

    const { data: { user }, error } = authResult;

    if (error || !user?.email) {
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
): Promise<CheckoutSessionResponse> {
    await ensureBillingSchema();

    const amount = getPlanPrice(input.planId, input.billingCycle);
    if (!amount) {
        throw new BillingError("Pricing is not configured for that plan.", 400);
    }

    const existing = await getSubscriptionByColumn("user_id", user.userId);
    const now = Date.now();
    const isActivePaidSubscription = Boolean(existing && isPaidPlanId(existing.planId) && existing.currentPeriodEnd > now);
    const isSamePlan = Boolean(existing && existing.planId === input.planId && existing.billingCycle === input.billingCycle && existing.currentPeriodEnd > now);
    if (isSamePlan) {
        throw new BillingError("That plan is already active.", 409);
    }

    if (!isActivePaidSubscription) {
        const intent: BillingIntentRecord = {
            id: randomUUID(),
            reference: buildBillingReference(user.userId),
            userId: user.userId,
            email: user.email,
            planId: input.planId,
            billingCycle: input.billingCycle,
            intentKind: "new_subscription",
            amountCents: amount * 100,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        };
        await upsertBillingIntent(intent);

        const checkout = await initializePaystackTransaction(request, user, {
            amountCents: intent.amountCents,
            reference: intent.reference,
            metadata: {
                billing_mode: "direct_purchase",
                intent_id: intent.id,
                user_id: user.userId,
                plan_id: input.planId,
                billing_cycle: input.billingCycle,
                source: "upgrade_page",
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
            ...checkout,
            checkoutMode: "inline",
        };
    }

    const currentRecord = existing as SubscriptionRecord;
    const proration = buildProrationPreview({
        currentPlanId: currentRecord.planId as Exclude<PlanId, "free">,
        currentBillingCycle: currentRecord.billingCycle,
        targetPlanId: input.planId,
        targetBillingCycle: input.billingCycle,
        currentPeriodStart: currentRecord.currentPeriodStart || getExistingCurrentPeriodStart(currentRecord, currentRecord.currentPeriodEnd),
        currentPeriodEnd: currentRecord.currentPeriodEnd,
        now,
    });
    const intent: BillingIntentRecord = {
        id: randomUUID(),
        reference: buildBillingReference(user.userId),
        userId: user.userId,
        email: user.email,
        planId: input.planId,
        billingCycle: input.billingCycle,
        intentKind: "plan_change",
        currentPlanId: currentRecord.planId,
        currentBillingCycle: currentRecord.billingCycle,
        currentPeriodStart: currentRecord.currentPeriodStart || getExistingCurrentPeriodStart(currentRecord, currentRecord.currentPeriodEnd),
        currentPeriodEnd: currentRecord.currentPeriodEnd,
        prorationCreditCents: proration.creditAppliedCents,
        nextRecurringAmountCents: proration.nextRecurringAmountCents,
        amountCents: proration.amountDueNowCents,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    };
    await upsertBillingIntent(intent);

    if (proration.amountDueNowCents <= 0) {
        await handlePlanChangeSuccess({}, intent, currentRecord);
        return {
            authorizationUrl: "",
            accessCode: "",
            reference: intent.reference,
            checkoutMode: "no_charge",
            proration,
            billingAccount: await getBillingAccountForUser(user.userId),
        };
    }

    const checkout = await initializePaystackTransaction(request, user, {
        amountCents: proration.amountDueNowCents,
        reference: intent.reference,
        metadata: {
            billing_mode: "plan_change",
            intent_id: intent.id,
            user_id: user.userId,
            plan_id: input.planId,
            billing_cycle: input.billingCycle,
            current_plan_id: currentRecord.planId,
            current_billing_cycle: currentRecord.billingCycle,
            source: "upgrade_page",
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
        ...checkout,
        checkoutMode: "inline",
        proration,
    };
}

export async function createAnonymousPurchaseIntent(request: Request, input: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    email: string;
    referralCode?: string | null;
}): Promise<{ reference: string; accessCode: string; authorizationUrl: string; amountCents: number }> {
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
        intentKind: "new_subscription",
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
        authorizationUrl: checkout.authorizationUrl,
        amountCents: intent.amountCents,
    };
}

export async function processDueBillingRenewals(referenceTime = Date.now()): Promise<{
    processedAt: string;
    results: RenewalRunResult[];
}> {
    await ensureBillingSchema();

    const dueSubscriptions = await listSubscriptionsDueForManualRenewal(referenceTime);
    const results: RenewalRunResult[] = [];

    for (const record of dueSubscriptions) {
        const moneyCreditSummary = await summarizeMoneyCreditsForUser(record.userId);
        if (moneyCreditSummary.available <= 0) {
            continue;
        }

        results.push(await processManualRenewalAdjustment(record, moneyCreditSummary.available, referenceTime));
    }

    return {
        processedAt: new Date(referenceTime).toISOString(),
        results,
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
    if (!record?.paystackSubscriptionCode || !record.paystackEmailToken) {
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
    const snapshot = await fetchPaymentSnapshot(reference);
    return {
        paid: snapshot.paid,
        email: snapshot.email,
        planId: snapshot.planId,
    };
}

export async function resolvePaidActivation(reference: string, user: VerifiedUser | null = null): Promise<ActivationResolution> {
    return resolvePaidActivationInternal(reference, user);
}

export async function createPaidActivationAccount(input: {
    reference: string;
    password: string;
    activationNonce: string;
}): Promise<PaidActivationState> {
    const normalizedReference = input.reference.trim();
    if (!normalizedReference) {
        throw new BillingError("Payment reference is missing.", 400);
    }

    const validatedIntent = await validateActivationNonce(normalizedReference, input.activationNonce);
    if (!validatedIntent) {
        throw new BillingAuthError("This account creation session is no longer valid. Restart the payment handoff.");
    }

    const existingUser = await findAuthUserByEmail(validatedIntent.email);
    if (existingUser) {
        await clearActivationNonce(normalizedReference);
        return (await resolvePaidActivationInternal(normalizedReference, null)).state;
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
        email: validatedIntent.email,
        password: input.password,
        email_confirm: true,
    });

    if (error || !data.user?.id || !data.user.email) {
        throw new BillingError(error?.message || "The paid account could not be created.", 502);
    }

    await confirmPaystackTransaction(normalizedReference, {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split("@")[0],
    });

    const claimedIntent = await getBillingIntentByReference(normalizedReference);
    if (claimedIntent) {
        await markActivationClaimed(claimedIntent, {
            userId: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email.split("@")[0],
        });
    } else {
        await clearActivationNonce(normalizedReference);
    }

    return buildActivationState({
        status: "payment_verified_existing_continue_setup",
        reference: normalizedReference,
        email: data.user.email,
        planId: validatedIntent.planId,
        billingCycle: validatedIntent.billingCycle,
    });
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

    if (claimedIntent) {
        await markActivationClaimed(claimedIntent, user);
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
