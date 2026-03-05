import { PLANS, PlanId, PlanConfig } from "../config/plans";
import { EmployerSettings } from "./schema";

export function getPlanById(planId: string | undefined | null): PlanConfig {
    if (!planId) return PLANS.free;
    return PLANS[planId as PlanId] || PLANS.free;
}

export function getUserPlan(userProfile: EmployerSettings | null | undefined): PlanConfig {
    if (!userProfile) return PLANS.free;

    // Need to safely check the data structure of userProfile
    // If it has proStatus, use it
    const planId = userProfile.proStatus || 'free';
    return getPlanById(planId);
}

export function canUseDriveSync(plan: PlanConfig): boolean {
    return plan.driveSync;
}

export function canCreateEmployee(plan: PlanConfig, currentActiveEmployeesCount: number): boolean {
    return currentActiveEmployeesCount < plan.maxActiveEmployees;
}

export function isRecordWithinArchive(plan: PlanConfig, recordDate: Date | string | number): boolean {
    const date = new Date(recordDate);
    const now = new Date();

    // Calculate months difference
    const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

    return monthsDiff <= plan.archiveMonths;
}

export function shouldUpsellForArchive(plan: PlanConfig, recordDate: Date | string | number): boolean {
    return !isRecordWithinArchive(plan, recordDate);
}
