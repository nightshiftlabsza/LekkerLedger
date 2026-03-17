import type { BillingAccountSummary, VerifiedEntitlements } from "./billing";
import type { BillingCycle, PlanId } from "../config/plans";

const E2E_AUTH_BYPASS_COOKIE = "ll-e2e-auth-bypass";
const QA_USER_ID = "e2e-paid-user";
const QA_EMAIL = "qa-paid@example.com";

function buildCookieMap(request: Request) {
    const rawCookie = request.headers.get("cookie") ?? "";
    return new Map(
        rawCookie
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const [name, ...valueParts] = part.split("=");
                return [name, valueParts.join("=")];
            }),
    );
}

export function hasE2EBillingBypass(request: Request): boolean {
    if (process.env.E2E_BYPASS_AUTH !== "1") {
        return false;
    }

    return buildCookieMap(request).get(E2E_AUTH_BYPASS_COOKIE) === "1";
}

export function buildE2EPaidEntitlements(
    planId: Exclude<PlanId, "free"> = "standard",
    billingCycle: BillingCycle = "monthly",
): VerifiedEntitlements {
    const paidUntil = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
    return {
        userId: QA_USER_ID,
        email: QA_EMAIL,
        planId,
        billingCycle,
        status: "active",
        paidUntil,
        nextChargeAt: paidUntil,
        cancelAtPeriodEnd: false,
        availableReferralMonths: 0,
        pendingReferralMonths: 0,
        isActive: true,
    };
}

export function buildE2EBillingAccount(planId: Exclude<PlanId, "free"> = "standard") {
    const entitlements = buildE2EPaidEntitlements(planId);
    const account: BillingAccountSummary = {
        referralCode: "QA-E2E",
        nextChargeAt: entitlements.nextChargeAt,
        cancelAtPeriodEnd: false,
        availableReferralMonths: 0,
        pendingReferralMonths: 0,
        successfulReferralCount: 0,
        totalReferralMonthsEarned: 0,
    };

    return {
        entitlements,
        account,
    };
}

export function buildE2EAuthUserSnapshot() {
    return {
        id: QA_USER_ID,
        email: QA_EMAIL,
    };
}
