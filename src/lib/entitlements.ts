import { PLANS, PlanId, PlanConfig } from "../config/plans";
import { isPaidPlanId } from "./billing";
import { EmployerSettings } from "./schema";

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

export function canUseDriveSync(plan: PlanConfig): boolean {
    return plan.features.driveSync;
}

export function canUseAutoBackup(plan: PlanConfig): boolean {
    return plan.features.autoBackup;
}

export function canUseLeaveTracking(plan: PlanConfig): boolean {
    return plan.features.leaveTracking;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canBrowseLeaveHistory(_plan: PlanConfig): boolean {
    return true;
}

export function canUseDocumentsHub(plan: PlanConfig): boolean {
    return plan.features.documentsHub;
}

export function canUploadSignedContractCopies(plan: PlanConfig): boolean {
    return plan.features.contractSignedCopyUpload;
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
    return plan.features.vaultUploads;
}

export function canUseYearEndSummary(plan: PlanConfig): boolean {
    return plan.features.yearEndSummary;
}

export function canUseFullHistoryExport(plan: PlanConfig): boolean {
    return plan.features.fullHistoryExport;
}

export function canUseContractGenerator(plan: PlanConfig): boolean {
    return plan.features.contractGenerator;
}

export function canUseUFilingExport(plan: PlanConfig): boolean {
    return plan.features.ufilingExport;
}

export function canDownloadRoePack(plan: PlanConfig): boolean {
    return plan.features.roeDownloads;
}

export function canCreateEmployee(plan: PlanConfig, currentActiveEmployeesCount: number): boolean {
    return currentActiveEmployeesCount < plan.maxActiveEmployees;
}

export function canUseMultipleHouseholds(plan: PlanConfig): boolean {
    return plan.features.multiHousehold;
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
