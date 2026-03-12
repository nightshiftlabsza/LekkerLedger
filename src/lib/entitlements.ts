import { PLANS, PlanId, PlanConfig } from "../config/plans";
import { isPaidPlanId } from "./billing";
import { EmployerSettings } from "./schema";

export type FeatureKey =
    | "payslips.basic"
    | "contracts.drafts"
    | "contracts.signedUploads"
    | "documents.coreHub"
    | "exports.ufilingCsv"
    | "exports.roe"
    | "sync.encrypted"
    | "documents.vault"
    | "records.advancedEmployment"
    | "summary.yearEndPdf"
    | "households.multiple"
    | "support.priority"
    | "android.priorityAccess";

export interface FeatureEntitlement {
    key: FeatureKey;
    minPlan: PlanId;
    status: "live" | "planned";
    upsellHeadline: string;
    upsellBody: string;
}

export const ENTITLEMENTS: Record<FeatureKey, FeatureEntitlement> = {
    "payslips.basic": {
        key: "payslips.basic",
        minPlan: "free",
        status: "live",
        upsellHeadline: "",
        upsellBody: "",
    },
    "contracts.drafts": {
        key: "contracts.drafts",
        minPlan: "standard",
        status: "live",
        upsellHeadline: "This feature is available on Standard",
        upsellBody: "Upgrade to Standard to create employment contracts.",
    },
    "contracts.signedUploads": {
        key: "contracts.signedUploads",
        minPlan: "standard",
        status: "live",
        upsellHeadline: "This feature is available on Standard",
        upsellBody: "Upgrade to Standard to store your signed employment contract copies.",
    },
    "documents.coreHub": {
        key: "documents.coreHub",
        minPlan: "standard",
        status: "live",
        upsellHeadline: "This feature is available on Standard",
        upsellBody: "Upgrade to unlock the broader documents hub for payslips and contracts.",
    },
    "exports.ufilingCsv": {
        key: "exports.ufilingCsv",
        minPlan: "standard",
        status: "live",
        upsellHeadline: "This export is available on Standard",
        upsellBody: "Upgrade to Standard for easy uFiling CSV exports.",
    },
    "exports.roe": {
        key: "exports.roe",
        minPlan: "standard",
        status: "live",
        upsellHeadline: "This export is available on Standard",
        upsellBody: "Upgrade to Standard to download Return of Earnings (ROE) batches.",
    },
    "sync.encrypted": {
        key: "sync.encrypted",
        minPlan: "standard",
        status: "live",
        upsellHeadline: "Encrypted sync is available on Standard",
        upsellBody: "Upgrade to sync your data across devices with end-to-end encryption.",
    },
    "documents.vault": {
        key: "documents.vault",
        minPlan: "pro",
        status: "live",
        upsellHeadline: "This feature is available on Pro",
        upsellBody: "Upgrade to Pro to unlock broader document storage beyond basic contracts and payslips.",
    },
    "records.advancedEmployment": {
        key: "records.advancedEmployment",
        minPlan: "pro",
        status: "planned",
        upsellHeadline: "Planned feature",
        upsellBody: "Advanced employment records are planned for Pro but are not available yet.",
    },
    "summary.yearEndPdf": {
        key: "summary.yearEndPdf",
        minPlan: "pro",
        status: "live",
        upsellHeadline: "Year-end summaries are available on Pro",
        upsellBody: "Upgrade to Pro to generate consolidated employment summaries for the tax year.",
    },
    "households.multiple": {
        key: "households.multiple",
        minPlan: "pro",
        status: "live",
        upsellHeadline: "Multiple households are supported on Pro",
        upsellBody: "Upgrade to Pro to organize and switch between multiple workers or holiday homes.",
    },
    "support.priority": {
        key: "support.priority",
        minPlan: "pro",
        status: "live",
        upsellHeadline: "Priority support requires Pro",
        upsellBody: "Upgrade to Pro to receive faster customer support.",
    },
    "android.priorityAccess": {
        key: "android.priorityAccess",
        minPlan: "pro",
        status: "planned",
        upsellHeadline: "Android App Access",
        upsellBody: "Priority access to the Android app is a planned feature for Pro users.",
    },
};

const PLAN_WEIGHTS: Record<PlanId, number> = {
    free: 0,
    standard: 1,
    pro: 2,
};

export function checkFeatureAccess(planId: PlanId, featureKey: FeatureKey): { hasAccess: boolean; isLive: boolean; entitlement: FeatureEntitlement } {
    const entitlement = ENTITLEMENTS[featureKey];
    const hasAccess = PLAN_WEIGHTS[planId] >= PLAN_WEIGHTS[entitlement.minPlan];
    return {
        hasAccess,
        isLive: entitlement.status === "live",
        entitlement,
    };
}

export function getFeatureEntitlement(featureKey: FeatureKey): FeatureEntitlement {
    return ENTITLEMENTS[featureKey];
}

function normalizePlanId(planId: string | undefined | null): PlanId {
    if (!planId || planId === "free") return "free";
    if (planId === "standard" || planId === "annual" || planId === "trial") return "standard";
    if (planId === "pro" || planId === "lifetime") return "pro";
    return "free";
}

export function getPlanById(planId: string | undefined | null): PlanConfig {
    return PLANS[normalizePlanId(planId)];
}

export function getUserPlan(userProfile: EmployerSettings | null | undefined, now = new Date()): PlanConfig {
    if (!userProfile) return PLANS.free;

    const resolvedPlan = getPlanById(userProfile.proStatus || "free");
    if (!isPaidPlanId(resolvedPlan.id)) {
        return resolvedPlan;
    }

    if (userProfile.paidUntil) {
        const paidUntil = new Date(userProfile.paidUntil);
        if (!Number.isNaN(paidUntil.getTime()) && paidUntil <= now) {
            return PLANS.free;
        }
    }

    return resolvedPlan;
}

export function hasPaidAccess(userProfile: EmployerSettings | null | undefined, now = new Date()): boolean {
    return isPaidPlanId(getUserPlan(userProfile, now).id);
}

export function canUseEncryptedSync(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "sync.encrypted").hasAccess;
}

export function canUseLeaveTracking(plan: PlanConfig): boolean {
    // Retain original plan.features logic if not explicitly in entitlement config, or map here
    return plan.features.leaveTracking;
}

export function canBrowseLeaveHistory(_plan: PlanConfig): boolean {
    return true;
}

export function canUseDocumentsHub(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "documents.coreHub").hasAccess;
}

export function canUploadSignedContractCopies(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "contracts.signedUploads").hasAccess;
}

export function assertCanUploadSignedContractCopies(plan: PlanConfig): void {
    if (!canUploadSignedContractCopies(plan)) {
        throw new Error("Signed contract uploads are only available on Standard and Pro.");
    }
}

export function canUseContractSignedCopyUpload(plan: PlanConfig): boolean {
    return canUploadSignedContractCopies(plan);
}

export function canUseVaultUploads(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "documents.vault").hasAccess;
}

export function canUseYearEndSummary(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "summary.yearEndPdf").hasAccess;
}

export function canUseFullHistoryExport(plan: PlanConfig): boolean {
    return plan.features.fullHistoryExport;
}

export function canUseContractGenerator(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "contracts.drafts").hasAccess;
}

export function canUseUFilingExport(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "exports.ufilingCsv").hasAccess;
}

export function canDownloadRoePack(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "exports.roe").hasAccess;
}

export function canCreateEmployee(plan: PlanConfig, currentActiveEmployeesCount: number): boolean {
    return currentActiveEmployeesCount < plan.maxActiveEmployees;
}

export function canUseMultipleHouseholds(plan: PlanConfig): boolean {
    return checkFeatureAccess(plan.id, "households.multiple").hasAccess;
}

export function canAddHousehold(plan: PlanConfig, currentHouseholdsCount: number): boolean {
    return currentHouseholdsCount < plan.maxHouseholds;
}

export function canUseAdvancedLeaveFeatures(plan: PlanConfig): boolean {
    return plan.id === "pro";
}

export function isRecordWithinArchive(plan: PlanConfig, recordDate: Date | string | number): boolean {
    const date = new Date(recordDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    return monthsDiff <= plan.archiveMonths;
}

export function shouldUpsellForArchive(plan: PlanConfig, recordDate: Date | string | number): boolean {
    return !isRecordWithinArchive(plan, recordDate);
}
