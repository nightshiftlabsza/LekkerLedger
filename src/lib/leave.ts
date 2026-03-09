import {
    addDays,
    addMonths,
    addYears,
    differenceInCalendarDays,
    differenceInCalendarMonths,
    eachDayOfInterval,
    format,
    isWeekend,
    parseISO,
    subYears,
} from "date-fns";
import {
    Contract,
    CustomLeaveType,
    DefaultLeaveType,
    LeaveAllocation,
    LeaveCarryOver,
    LeaveRecord,
} from "./schema";
import { toIsoDate, isValidDate } from "./utils";

export interface LeaveAllowance {
    allowance: number;
    used: number;
    remaining: number;
    isUnlimited?: boolean;
    carryOverRemaining?: number;
}

export interface CalculatedLeaveBalances {
    annual: LeaveAllowance;
    sick: LeaveAllowance;
    family: LeaveAllowance;
}

export interface LeaveCycle {
    start: Date;
    end: Date;
    startIso: string;
    endIso: string;
}

export interface AnnualLeaveSummary {
    currentCycle: LeaveCycle | null;
    currentCycleAllowance: number;
    usedInCurrentCycle: number;
    remainingInCurrentCycle: number;
    carryOvers: LeaveCarryOver[];
    remainingCarryOver: number;
    totalRemainingAvailable: number;
    updatedRecords: LeaveRecord[];
}

export interface AnnualLeaveForecast {
    status: "not-enough-data" | "may-run-out" | "on-track";
    currentCycle: LeaveCycle | null;
    projectedDate: Date | null;
    projectedRemainingAtCycleEnd: number | null;
    averageDaysPerMonth: number;
}

export interface CarryOverNudge {
    carryOver: LeaveCarryOver;
    thresholdDate: Date;
    remainingDays: number;
    isPastThreshold: boolean;
}

export const DEFAULT_LEAVE_TYPE_LABELS: Record<DefaultLeaveType, string> = {
    annual: "Annual leave",
    sick: "Sick leave",
    family: "Family responsibility",
};

const DEFAULT_ALLOWANCE: Record<DefaultLeaveType, number> = {
    annual: 21,
    sick: 30,
    family: 3,
};

function getRecordSortTime(record: LeaveRecord): number {
    return normaliseLeaveDate(record).start.getTime();
}

function prettifyLeaveType(type: string): string {
    if (!type) return "Leave";
    const normalised = type.replace(/[-_]+/g, " ").trim();
    return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

function getReferenceContract(contracts: Contract[], referenceDate: Date): Contract | null {
    const activeContracts = contracts
        .filter((contract) => ["final", "signed_copy_stored", "awaiting_signed_copy", "draft"].includes(contract.status as string));

    if (activeContracts.length === 0) return null;

    const referenceTime = referenceDate.getTime();
    const eligible = activeContracts
        .filter((contract) => {
            const effective = new Date(contract.effectiveDate);
            return isValidDate(effective) && effective.getTime() <= referenceTime;
        })
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
            || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (eligible.length > 0) {
        return eligible[0];
    }

    return [...activeContracts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
}

export function isDefaultLeaveType(type: string): type is DefaultLeaveType {
    return type === "annual" || type === "sick" || type === "family";
}

export function formatLeaveValue(value: number): string {
    if (!Number.isFinite(value)) return "Unlimited";
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function getLeaveTypeLabel(type: string, customLeaveTypes: CustomLeaveType[] = [], fallbackLabel?: string): string {
    if (isDefaultLeaveType(type)) {
        return DEFAULT_LEAVE_TYPE_LABELS[type];
    }

    const customType = customLeaveTypes.find((item) => item.id === type);
    return customType?.name || fallbackLabel || prettifyLeaveType(type);
}

export function normaliseLeaveDate(record: LeaveRecord): { start: Date; end: Date } {
    const start = parseISO(record.startDate || record.date);
    const end = parseISO(record.endDate || record.startDate || record.date);
    return {
        start,
        end: end < start ? start : end,
    };
}

export function formatLeaveRange(record: LeaveRecord): string {
    const { start, end } = normaliseLeaveDate(record);
    if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
        return format(start, "dd MMM yyyy");
    }
    return `${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`;
}

export function estimateLeaveDays(startDate: string, endDate: string): number {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (!isValidDate(start) || !isValidDate(end)) return 0;
    const safeEnd = end < start ? start : end;
    const days = eachDayOfInterval({ start, end: safeEnd }).filter((day) => !isWeekend(day)).length;
    return days > 0 ? days : differenceInCalendarDays(safeEnd, start) + 1;
}

export function resolveLeaveAllowance(
    type: string,
    contracts: Contract[],
    options: { referenceDate?: Date; customLeaveTypes?: CustomLeaveType[] } = {}
): number {
    const referenceDate = options.referenceDate ?? new Date();

    if (isDefaultLeaveType(type)) {
        const latest = getReferenceContract(contracts, referenceDate);
        if (!latest) return DEFAULT_ALLOWANCE[type];

        if (type === "annual") return latest.leave.annualDays || DEFAULT_ALLOWANCE.annual;
        if (type === "sick") return latest.leave.sickDays || DEFAULT_ALLOWANCE.sick;
        return DEFAULT_ALLOWANCE.family;
    }

    const customType = options.customLeaveTypes?.find((item) => item.id === type);
    if (!customType || customType.annualAllowance === undefined) {
        return Number.POSITIVE_INFINITY;
    }

    return customType.annualAllowance;
}

export function getLeaveCycleForDate(employeeStartDate: string, referenceDate: Date): LeaveCycle | null {
    const start = parseISO(employeeStartDate);
    if (!isValidDate(start) || referenceDate < start) return null;

    let cycleStart = start;
    let guard = 0;
    while (guard < 100) {
        const nextCycleStart = addYears(cycleStart, 1);
        const cycleEnd = addDays(nextCycleStart, -1);
        if (referenceDate <= cycleEnd) {
            return {
                start: cycleStart,
                end: cycleEnd,
                startIso: toIsoDate(cycleStart),
                endIso: toIsoDate(cycleEnd),
            };
        }
        cycleStart = nextCycleStart;
        guard += 1;
    }

    return null;
}

export function listLeaveCycles(employeeStartDate: string, referenceDate: Date): LeaveCycle[] {
    const start = parseISO(employeeStartDate);
    if (!isValidDate(start) || referenceDate < start) return [];

    const cycles: LeaveCycle[] = [];
    let cycleStart = start;
    let guard = 0;

    while (guard < 100 && cycleStart <= referenceDate) {
        const nextCycleStart = addYears(cycleStart, 1);
        const cycleEnd = addDays(nextCycleStart, -1);
        cycles.push({
            start: cycleStart,
            end: cycleEnd,
            startIso: toIsoDate(cycleStart),
            endIso: toIsoDate(cycleEnd),
        });
        cycleStart = nextCycleStart;
        guard += 1;
    }

    return cycles;
}

export function calculateAnnualLeaveSummary(
    employeeStartDate: string,
    records: LeaveRecord[],
    contracts: Contract[],
    referenceDate: Date = new Date()
): AnnualLeaveSummary {
    const currentCycle = getLeaveCycleForDate(employeeStartDate, referenceDate);
    if (!currentCycle) {
        return {
            currentCycle: null,
            currentCycleAllowance: 0,
            usedInCurrentCycle: 0,
            remainingInCurrentCycle: 0,
            carryOvers: [],
            remainingCarryOver: 0,
            totalRemainingAvailable: 0,
            updatedRecords: records.map((record) => (record.type === "annual" ? { ...record, allocations: [] } : record)),
        };
    }

    const cycles = listLeaveCycles(employeeStartDate, referenceDate);
    const annualRecords = records
        .filter((record) => record.type === "annual")
        .sort((a, b) => getRecordSortTime(a) - getRecordSortTime(b));

    const recordsByCycle = new Map<string, LeaveRecord[]>();
    for (const record of annualRecords) {
        const cycle = getLeaveCycleForDate(employeeStartDate, normaliseLeaveDate(record).start);
        if (!cycle) continue;
        const existing = recordsByCycle.get(cycle.endIso) ?? [];
        existing.push(record);
        recordsByCycle.set(cycle.endIso, existing);
    }

    const carryOvers: LeaveCarryOver[] = [];
    const updatedAnnualRecords = new Map<string, LeaveRecord>();
    let usedInCurrentCycle = 0;
    let currentCycleAllowance = resolveLeaveAllowance("annual", contracts, { referenceDate: currentCycle.start });

    for (const cycle of cycles) {
        const cycleRecords = (recordsByCycle.get(cycle.endIso) ?? [])
            .sort((a, b) => getRecordSortTime(a) - getRecordSortTime(b));
        const cycleAllowance = resolveLeaveAllowance("annual", contracts, { referenceDate: cycle.start });
        let usedFromCurrentCycle = 0;

        for (const record of cycleRecords) {
            let daysRemaining = record.days;
            const allocations: LeaveAllocation[] = [];

            for (const bucket of carryOvers) {
                const bucketRemaining = Math.max(bucket.daysCarried - bucket.daysUsedFromCarry, 0);
                if (bucketRemaining <= 0 || daysRemaining <= 0) continue;

                const taken = Math.min(bucketRemaining, daysRemaining);
                bucket.daysUsedFromCarry += taken;
                daysRemaining -= taken;
                allocations.push({
                    source: "carry-over",
                    days: taken,
                    fromCycleEnd: bucket.fromCycleEnd,
                });
            }

            if (daysRemaining > 0) {
                usedFromCurrentCycle += daysRemaining;
                allocations.push({
                    source: "current-cycle",
                    days: daysRemaining,
                    cycleStart: cycle.startIso,
                    cycleEnd: cycle.endIso,
                });
            }

            updatedAnnualRecords.set(record.id, { ...record, allocations });
        }

        if (cycle.endIso === currentCycle.endIso) {
            currentCycleAllowance = cycleAllowance;
            usedInCurrentCycle = usedFromCurrentCycle;
        }

        if (cycle.end < referenceDate) {
            const daysCarried = Math.max(cycleAllowance - usedFromCurrentCycle, 0);
            carryOvers.push({
                id: `${annualRecords[0]?.householdId ?? "default"}:${cycle.endIso}`,
                householdId: annualRecords[0]?.householdId ?? "default",
                employeeId: annualRecords[0]?.employeeId ?? "",
                fromCycleEnd: cycle.endIso,
                daysCarried,
                daysUsedFromCarry: 0,
            });
        }
    }

    const remainingCarryOver = carryOvers.reduce((sum, bucket) => sum + Math.max(bucket.daysCarried - bucket.daysUsedFromCarry, 0), 0);
    const remainingInCurrentCycle = currentCycleAllowance - usedInCurrentCycle;

    return {
        currentCycle,
        currentCycleAllowance,
        usedInCurrentCycle,
        remainingInCurrentCycle,
        carryOvers,
        remainingCarryOver,
        totalRemainingAvailable: remainingInCurrentCycle + remainingCarryOver,
        updatedRecords: records.map((record) => (
            record.type === "annual"
                ? updatedAnnualRecords.get(record.id) ?? { ...record, allocations: [] }
                : record
        )),
    };
}

export function getCarryOverNudge(carryOvers: LeaveCarryOver[], referenceDate: Date = new Date()): CarryOverNudge | null {
    const outstanding = carryOvers
        .map((carryOver) => ({
            carryOver,
            thresholdDate: addMonths(parseISO(carryOver.fromCycleEnd), 6),
            remainingDays: Math.max(carryOver.daysCarried - carryOver.daysUsedFromCarry, 0),
        }))
        .filter((entry) => entry.remainingDays > 0)
        .sort((a, b) => a.thresholdDate.getTime() - b.thresholdDate.getTime());

    const matching = outstanding.find((entry) => differenceInCalendarDays(entry.thresholdDate, referenceDate) <= 30);
    if (!matching) return null;

    return {
        ...matching,
        isPastThreshold: matching.thresholdDate < referenceDate,
    };
}

export function calculateAnnualLeaveForecast(
    employeeStartDate: string,
    records: LeaveRecord[],
    contracts: Contract[],
    referenceDate: Date = new Date()
): AnnualLeaveForecast {
    const summary = calculateAnnualLeaveSummary(employeeStartDate, records, contracts, referenceDate);
    if (!summary.currentCycle || differenceInCalendarMonths(referenceDate, summary.currentCycle.start) < 3) {
        return {
            status: "not-enough-data",
            currentCycle: summary.currentCycle,
            projectedDate: null,
            projectedRemainingAtCycleEnd: null,
            averageDaysPerMonth: 0,
        };
    }

    const elapsedDays = Math.max(differenceInCalendarDays(referenceDate, summary.currentCycle.start), 1);
    const elapsedMonths = Math.max(elapsedDays / 30.4375, 1);
    const averageDaysPerMonth = summary.usedInCurrentCycle / elapsedMonths;

    if (averageDaysPerMonth <= 0) {
        return {
            status: "on-track",
            currentCycle: summary.currentCycle,
            projectedDate: null,
            projectedRemainingAtCycleEnd: Math.max(summary.totalRemainingAvailable, 0),
            averageDaysPerMonth,
        };
    }

    const monthsUntilEmpty = summary.totalRemainingAvailable / averageDaysPerMonth;
    const projectedDate = addDays(referenceDate, Math.round(monthsUntilEmpty * 30.4375));

    if (projectedDate <= summary.currentCycle.end) {
        return {
            status: "may-run-out",
            currentCycle: summary.currentCycle,
            projectedDate,
            projectedRemainingAtCycleEnd: null,
            averageDaysPerMonth,
        };
    }

    const daysRemainingInCycle = Math.max(differenceInCalendarDays(summary.currentCycle.end, referenceDate), 0);
    const projectedRemainingAtCycleEnd = Math.max(summary.totalRemainingAvailable - ((daysRemainingInCycle / 30.4375) * averageDaysPerMonth), 0);

    return {
        status: "on-track",
        currentCycle: summary.currentCycle,
        projectedDate: null,
        projectedRemainingAtCycleEnd,
        averageDaysPerMonth,
    };
}

export function getLeaveAllowanceForType(
    type: string,
    records: LeaveRecord[],
    contracts: Contract[],
    referenceDate: Date = new Date(),
    customLeaveTypes: CustomLeaveType[] = [],
    employeeStartDate?: string
): LeaveAllowance {
    if (type === "annual" && employeeStartDate) {
        const summary = calculateAnnualLeaveSummary(employeeStartDate, records, contracts, referenceDate);
        return {
            allowance: summary.currentCycleAllowance + summary.remainingCarryOver,
            used: summary.usedInCurrentCycle + summary.carryOvers.reduce((sum, bucket) => sum + bucket.daysUsedFromCarry, 0),
            remaining: summary.totalRemainingAvailable,
            carryOverRemaining: summary.remainingCarryOver,
        };
    }

    const allowance = resolveLeaveAllowance(type, contracts, { referenceDate, customLeaveTypes });
    const isUnlimited = !Number.isFinite(allowance);
    let used = 0;

    if (type === "annual" || type === "family" || !isDefaultLeaveType(type)) {
        const referenceYear = referenceDate.getFullYear();
        used = records
            .filter((record) => record.type === type)
            .filter((record) => normaliseLeaveDate(record).start.getFullYear() === referenceYear)
            .reduce((sum, record) => sum + record.days, 0);
    } else {
        const cycleStart = subYears(referenceDate, 3);
        used = records
            .filter((record) => record.type === type)
            .filter((record) => normaliseLeaveDate(record).start >= cycleStart)
            .reduce((sum, record) => sum + record.days, 0);
    }

    return {
        allowance,
        used,
        remaining: isUnlimited ? Number.POSITIVE_INFINITY : allowance - used,
        isUnlimited,
    };
}

export function calculateLeaveBalances(
    startDate: string,
    totalDaysWorked: number,
    records: LeaveRecord[],
    referenceDate: Date = new Date()
): CalculatedLeaveBalances {
    const annualAllowance = Math.max(15, Math.floor(totalDaysWorked / 17));
    const sickAllowance = Math.max(0, Math.floor(totalDaysWorked / 26));

    return {
        annual: {
            ...getLeaveAllowanceForType("annual", records, [], referenceDate, [], startDate),
            allowance: annualAllowance,
            remaining: annualAllowance - records.filter((record) => record.type === "annual").reduce((sum, record) => sum + record.days, 0),
        },
        sick: {
            ...getLeaveAllowanceForType("sick", records, [], referenceDate),
            allowance: Math.max(DEFAULT_ALLOWANCE.sick, sickAllowance),
            remaining: Math.max(DEFAULT_ALLOWANCE.sick, sickAllowance) - records.filter((record) => record.type === "sick").reduce((sum, record) => sum + record.days, 0),
        },
        family: getLeaveAllowanceForType("family", records, [], referenceDate),
    };
}
