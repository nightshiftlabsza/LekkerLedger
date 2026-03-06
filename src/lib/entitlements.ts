import { PLANS, PlanId, PlanConfig } from "../config/plans";
import { isPaidPlanId } from "./billing";
import { EmployerSettings } from "./schema";

function normalizePlanId(planId: string | undefined | null): PlanId {
    if (!planId || planId === "free") return "free";
    if (planId === "standard" || planId === "annual") return "standard";
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
    return plan.driveSync;
}

export function canUseLeaveTracking(plan: PlanConfig): boolean {
    return plan.leaveTracking;
}

export function canUseDocumentsHub(plan: PlanConfig): boolean {
    return plan.documentsHub;
}

export function canUseContractGenerator(plan: PlanConfig): boolean {
    return plan.contractGenerator;
}

export function canUseUFilingExport(plan: PlanConfig): boolean {
    return plan.ufilingExport;
}

export function canDownloadRoePack(plan: PlanConfig): boolean {
    return plan.roeDownloads;
}

export function canCreateEmployee(plan: PlanConfig, currentActiveEmployeesCount: number): boolean {
    return currentActiveEmployeesCount < plan.maxActiveEmployees;
}

export function canUseMultipleHouseholds(plan: PlanConfig): boolean {
    return plan.multiHousehold;
}

export function canAddHousehold(plan: PlanConfig, currentHouseholdsCount: number): boolean {
    return currentHouseholdsCount < plan.maxHouseholds;
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
