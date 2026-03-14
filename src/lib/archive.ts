import { PLANS, type PlanConfig, type PlanId } from "@/src/config/plans";
import type { DocumentMeta } from "./schema";

export interface ArchiveFilterResult<T> {
    visible: T[];
    hidden: T[];
    hiddenCount: number;
}

export interface StandardRetentionStatus {
    isStandard: boolean;
    showReminder: boolean;
    showElevenMonthWarning: boolean;
    purgeCandidates: DocumentMeta[];
    purgeCount: number;
    warningCount: number;
    oldestAffectedAt?: string;
}

const RETENTION_REMINDER_INTERVAL_DAYS = 30;

export function getUpgradePlanForArchive(planId: PlanId): Exclude<PlanId, "free"> | null {
    if (planId === "free") return "standard";
    if (planId === "standard") return "pro";
    return null;
}

export function getArchiveUpgradeHref(planId: PlanId): string {
    const target = getUpgradePlanForArchive(planId);
    return target ? `/upgrade?plan=${target}&pay=1` : "/upgrade";
}

export function getArchiveUpgradeLabel(planId: PlanId): string {
    const target = getUpgradePlanForArchive(planId);
    return target ? `Upgrade to ${PLANS[target].label}` : "Upgrade";
}

export function getArchiveUpgradeMessage(planId: PlanId, hiddenCount: number, noun = "record"): string {
    const target = getUpgradePlanForArchive(planId);
    const nounLabel = `${noun}${hiddenCount === 1 ? "" : "s"}`;

    if (!target) {
        return `You have ${hiddenCount} older ${nounLabel}.`;
    }

    return `You have ${hiddenCount} older ${nounLabel}. Upgrade to ${PLANS[target].label} to browse your full history.`;
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

export function isGeneratedPayrollDocument(document: DocumentMeta): boolean {
    if (document.source === "uploaded") return false;
    return document.type === "payslip" || document.type === "export";
}

function addMonths(date: Date, months: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + months, date.getDate(), 0, 0, 0, 0);
}

function subtractDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days, 0, 0, 0, 0);
}

function getOldestCreatedAt(documents: DocumentMeta[]): string | undefined {
    const sorted = [...documents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sorted[0]?.createdAt;
}

export function getStandardRetentionStatus({
    plan,
    documents,
    dismissedAt,
    now = new Date(),
}: {
    plan: PlanConfig;
    documents: DocumentMeta[];
    dismissedAt?: string;
    now?: Date;
}): StandardRetentionStatus {
    const isStandard = plan.id === "standard";
    if (!isStandard) {
        return {
            isStandard: false,
            showReminder: false,
            showElevenMonthWarning: false,
            purgeCandidates: [],
            purgeCount: 0,
            warningCount: 0,
        };
    }

    const generatedDocuments = documents.filter(isGeneratedPayrollDocument);
    const purgeCutoff = addMonths(now, -12);
    const warningCutoff = addMonths(now, -11);

    const purgeCandidates = generatedDocuments.filter((document) => {
        const createdAt = new Date(document.createdAt);
        return !Number.isNaN(createdAt.getTime()) && createdAt < purgeCutoff;
    });

    const warningCandidates = generatedDocuments.filter((document) => {
        const createdAt = new Date(document.createdAt);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= purgeCutoff && createdAt < warningCutoff;
    });

    const dismissalDate = dismissedAt ? new Date(dismissedAt) : null;
    const reminderVisibleAt = subtractDays(now, RETENTION_REMINDER_INTERVAL_DAYS);
    const showReminder = !dismissalDate || Number.isNaN(dismissalDate.getTime()) || dismissalDate <= reminderVisibleAt;

    return {
        isStandard,
        showReminder,
        showElevenMonthWarning: warningCandidates.length > 0,
        purgeCandidates,
        purgeCount: purgeCandidates.length,
        warningCount: warningCandidates.length,
        oldestAffectedAt: getOldestCreatedAt([...purgeCandidates, ...warningCandidates]),
    };
}
