import type { PlanConfig, PlanId } from "@/src/config/plans";
import type { DocumentMeta } from "./schema";

export interface ArchiveFilterResult<T> {
    visible: T[];
    hidden: T[];
    hiddenCount: number;
}

export function getUpgradePlanForArchive(planId: PlanId): Exclude<PlanId, "free"> | null {
    if (planId === "free") return "standard";
    if (planId === "standard") return "pro";
    return null;
}

export function getArchiveUpgradeHref(planId: PlanId): string {
    const target = getUpgradePlanForArchive(planId);
    return target ? `/upgrade?plan=${target}` : "/upgrade";
}

export function isUploadedDocument(document: DocumentMeta): boolean {
    return document.source === "uploaded";
}

export function isWithinArchiveWindow(plan: PlanConfig, value: Date | string | number, now = new Date()): boolean {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;
    const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    return monthsDiff <= plan.archiveMonths;
}

export function getArchiveCutoffDate(plan: PlanConfig, now = new Date()): Date {
    return new Date(now.getFullYear(), now.getMonth() - plan.archiveMonths, now.getDate(), 0, 0, 0, 0);
}

export function filterRecordsForArchiveWindow<T>(
    records: T[],
    plan: PlanConfig,
    getRecordDate: (record: T) => Date | string | number,
    options?: {
        alwaysVisible?: (record: T) => boolean;
        now?: Date;
    },
): ArchiveFilterResult<T> {
    const visible: T[] = [];
    const hidden: T[] = [];
    const now = options?.now ?? new Date();

    for (const record of records) {
        if (options?.alwaysVisible?.(record) || isWithinArchiveWindow(plan, getRecordDate(record), now)) {
            visible.push(record);
        } else {
            hidden.push(record);
        }
    }

    return {
        visible,
        hidden,
        hiddenCount: hidden.length,
    };
}
