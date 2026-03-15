import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import type { PayslipInput } from "./schema";

export interface PayslipDraftInput {
    id?: string;
    householdId: string;
    employeeId: string;
    monthKey: string;
    standardWorkingDaysThisMonth: number;
    ordinaryHoursPerDay: number;
    ordinaryHoursOverride?: number | null;
    overtimeHours: number;
    sundayHours: number;
    publicHolidayHours: number;
    shortShiftCount: number;
    shortShiftWorkedHours: number;
    shortFallHoursOverride?: number | null;
    hourlyRate: number;
    ordinarilyWorksSundays: boolean;
    includeAccommodation: boolean;
    accommodationCost?: number;
    otherDeductions: number;
    annualLeaveTaken?: number;
    sickLeaveTaken?: number;
    familyLeaveTaken?: number;
    createdAt?: Date;
}

export interface PayslipDraftDerived {
    monthKey: string;
    payPeriodStart: Date;
    payPeriodEnd: Date;
    standardWorkingDaysThisMonth: number;
    autoOrdinaryHours: number;
    ordinaryHours: number;
    hasManualOrdinaryHoursOverride: boolean;
    shortFallHours: number;
    hasShortfall: boolean;
}

export function getMonthKey(date: Date): string {
    return format(date, "yyyy-MM");
}

export function getMonthBounds(monthKey: string): { start: Date; end: Date } {
    const parsed = parse(`${monthKey}-01`, "yyyy-MM-dd", new Date());
    return {
        start: startOfMonth(parsed),
        end: endOfMonth(parsed),
    };
}

export function calculateOrdinaryHoursFromStandardDays(standardWorkingDaysThisMonth: number, ordinaryHoursPerDay: number): number {
    return Math.max(0, standardWorkingDaysThisMonth) * Math.max(0, ordinaryHoursPerDay);
}

export function calculateShortfallHours(shortShiftCount: number, shortShiftWorkedHours: number): number {
    return Math.max((Math.max(0, shortShiftCount) * 4) - Math.max(0, shortShiftWorkedHours), 0);
}

export function derivePayslipDraft(input: PayslipDraftInput): PayslipDraftDerived {
    const { start, end } = getMonthBounds(input.monthKey);
    const autoOrdinaryHours = calculateOrdinaryHoursFromStandardDays(
        input.standardWorkingDaysThisMonth,
        input.ordinaryHoursPerDay,
    );
    const hasManualOrdinaryHoursOverride = input.ordinaryHoursOverride !== null
        && input.ordinaryHoursOverride !== undefined
        && Number.isFinite(input.ordinaryHoursOverride);
    const ordinaryHours = hasManualOrdinaryHoursOverride
        ? Math.max(0, Number(input.ordinaryHoursOverride))
        : autoOrdinaryHours;
    const shortFallHours = input.shortFallHoursOverride !== null
        && input.shortFallHoursOverride !== undefined
        && Number.isFinite(input.shortFallHoursOverride)
        ? Math.max(0, Number(input.shortFallHoursOverride))
        : calculateShortfallHours(input.shortShiftCount, input.shortShiftWorkedHours);

    return {
        monthKey: input.monthKey,
        payPeriodStart: start,
        payPeriodEnd: end,
        standardWorkingDaysThisMonth: Math.max(0, input.standardWorkingDaysThisMonth),
        autoOrdinaryHours,
        ordinaryHours,
        hasManualOrdinaryHoursOverride,
        shortFallHours,
        hasShortfall: shortFallHours > 0,
    };
}

export function normalizePayslipDraftToInput(input: PayslipDraftInput): PayslipInput {
    const derived = derivePayslipDraft(input);
    return {
        id: input.id ?? crypto.randomUUID(),
        householdId: input.householdId,
        employeeId: input.employeeId,
        payPeriodStart: derived.payPeriodStart,
        payPeriodEnd: derived.payPeriodEnd,
        ordinaryHours: derived.ordinaryHours,
        overtimeHours: Math.max(0, input.overtimeHours),
        sundayHours: Math.max(0, input.sundayHours),
        publicHolidayHours: Math.max(0, input.publicHolidayHours),
        daysWorked: derived.standardWorkingDaysThisMonth,
        shortFallHours: derived.shortFallHours,
        hourlyRate: input.hourlyRate,
        includeAccommodation: input.includeAccommodation,
        accommodationCost: input.accommodationCost,
        advanceAmount: 0,
        otherDeductions: Math.max(0, input.otherDeductions),
        createdAt: input.createdAt ?? new Date(),
        ordinarilyWorksSundays: input.ordinarilyWorksSundays,
        ordinaryHoursPerDay: input.ordinaryHoursPerDay,
        annualLeaveTaken: Math.max(0, input.annualLeaveTaken ?? 0),
        sickLeaveTaken: Math.max(0, input.sickLeaveTaken ?? 0),
        familyLeaveTaken: Math.max(0, input.familyLeaveTaken ?? 0),
    };
}
