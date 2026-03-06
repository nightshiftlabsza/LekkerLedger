import { differenceInCalendarDays, eachDayOfInterval, format, isWeekend, parseISO, subYears } from "date-fns";
import { Contract, LeaveRecord, LeaveType } from "./schema";

export interface LeaveAllowance {
    allowance: number;
    used: number;
    remaining: number;
}

export interface CalculatedLeaveBalances {
    annual: LeaveAllowance;
    sick: LeaveAllowance;
    family: LeaveAllowance;
}

const DEFAULT_ALLOWANCE: Record<LeaveType, number> = {
    annual: 21,
    sick: 30,
    family: 3,
};

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
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const safeEnd = end < start ? start : end;
    const days = eachDayOfInterval({ start, end: safeEnd }).filter((day) => !isWeekend(day)).length;
    return days > 0 ? days : differenceInCalendarDays(safeEnd, start) + 1;
}

export function resolveLeaveAllowance(type: LeaveType, contracts: Contract[]): number {
    const activeContracts = contracts
        .filter((contract) => contract.status === "active" || contract.status === "draft")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const latest = activeContracts[0];
    if (!latest) return DEFAULT_ALLOWANCE[type];

    if (type === "annual") return latest.leave.annualDays || DEFAULT_ALLOWANCE.annual;
    if (type === "sick") return latest.leave.sickDays || DEFAULT_ALLOWANCE.sick;
    return DEFAULT_ALLOWANCE.family;
}

export function getLeaveAllowanceForType(
    type: LeaveType,
    records: LeaveRecord[],
    contracts: Contract[],
    referenceDate: Date = new Date()
): LeaveAllowance {
    const allowance = resolveLeaveAllowance(type, contracts);
    let used = 0;

    if (type === "annual" || type === "family") {
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
        remaining: allowance - used,
    };
}

export function calculateLeaveBalances(
    startDate: string,
    totalDaysWorked: number,
    records: LeaveRecord[],
    referenceDate: Date = new Date()
): CalculatedLeaveBalances {
    void startDate;
    const annualAllowance = Math.max(15, Math.floor(totalDaysWorked / 17));
    const sickAllowance = Math.max(0, Math.floor(totalDaysWorked / 26));

    return {
        annual: {
            ...getLeaveAllowanceForType("annual", records, [], referenceDate),
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
