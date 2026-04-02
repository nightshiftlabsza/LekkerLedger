import { addDays } from "date-fns";
import { toIsoDate } from "./utils";
import {
    buildEmptyOrdinaryWorkPattern,
    type OrdinaryWorkPattern,
    ORDINARY_WORK_PATTERN_KEYS,
} from "./ordinary-work-pattern";

export type PublicHolidaySource = "official-published" | "statutory-derived";

export interface PublicHoliday {
    date: string;
    name: string;
    observed: boolean;
    source: PublicHolidaySource;
    sourceLabel: string;
}

interface PayrollHolidayFixtureYear {
    year: number;
    source: PublicHolidaySource;
    sourceLabel: string;
    fixtures: Array<{
        date: string;
        name: string;
        observed?: boolean;
    }>;
}

const PAYROLL_HOLIDAY_FIXTURES: PayrollHolidayFixtureYear[] = [
    {
        year: 2026,
        source: "official-published",
        sourceLabel: "Official published source: South African Government public holidays list.",
        fixtures: [
            { date: "2026-01-01", name: "New Year's Day" },
            { date: "2026-03-21", name: "Human Rights Day" },
            { date: "2026-04-03", name: "Good Friday" },
            { date: "2026-04-06", name: "Family Day" },
            { date: "2026-04-27", name: "Freedom Day" },
            { date: "2026-05-01", name: "Workers' Day" },
            { date: "2026-06-16", name: "Youth Day" },
            { date: "2026-08-09", name: "National Women's Day" },
            { date: "2026-08-10", name: "National Women's Day Observed", observed: true },
            { date: "2026-09-24", name: "Heritage Day" },
            { date: "2026-12-16", name: "Day of Reconciliation" },
            { date: "2026-12-25", name: "Christmas Day" },
            { date: "2026-12-26", name: "Day of Goodwill" },
        ],
    },
    {
        year: 2027,
        source: "official-published",
        sourceLabel: "Official published source: South African Government public holidays list.",
        fixtures: [
            { date: "2027-01-01", name: "New Year's Day" },
            { date: "2027-03-21", name: "Human Rights Day" },
            { date: "2027-03-22", name: "Human Rights Day Observed", observed: true },
            { date: "2027-03-26", name: "Good Friday" },
            { date: "2027-03-29", name: "Family Day" },
            { date: "2027-04-27", name: "Freedom Day" },
            { date: "2027-05-01", name: "Workers' Day" },
            { date: "2027-06-16", name: "Youth Day" },
            { date: "2027-08-09", name: "National Women's Day" },
            { date: "2027-09-24", name: "Heritage Day" },
            { date: "2027-12-16", name: "Day of Reconciliation" },
            { date: "2027-12-25", name: "Christmas Day" },
            { date: "2027-12-26", name: "Day of Goodwill" },
            { date: "2027-12-27", name: "Day of Goodwill Observed", observed: true },
        ],
    },
    {
        year: 2028,
        source: "official-published",
        sourceLabel: "Official published source: DBE 2028 school calendar plus pinned statutory holiday fixtures.",
        fixtures: [
            { date: "2028-01-01", name: "New Year's Day" },
            { date: "2028-03-21", name: "Human Rights Day" },
            { date: "2028-04-14", name: "Good Friday" },
            { date: "2028-04-17", name: "Family Day" },
            { date: "2028-04-27", name: "Freedom Day" },
            { date: "2028-05-01", name: "Workers' Day" },
            { date: "2028-06-16", name: "Youth Day" },
            { date: "2028-08-09", name: "National Women's Day" },
            { date: "2028-09-24", name: "Heritage Day" },
            { date: "2028-09-25", name: "Heritage Day Observed", observed: true },
            { date: "2028-12-16", name: "Day of Reconciliation" },
            { date: "2028-12-25", name: "Christmas Day" },
            { date: "2028-12-26", name: "Day of Goodwill" },
        ],
    },
    {
        year: 2029,
        source: "statutory-derived",
        sourceLabel: "Derived from the Public Holidays Act rules plus pinned Easter fixtures; not an official yearly published list.",
        fixtures: [
            { date: "2029-01-01", name: "New Year's Day" },
            { date: "2029-03-21", name: "Human Rights Day" },
            { date: "2029-03-30", name: "Good Friday" },
            { date: "2029-04-02", name: "Family Day" },
            { date: "2029-04-27", name: "Freedom Day" },
            { date: "2029-05-01", name: "Workers' Day" },
            { date: "2029-06-16", name: "Youth Day" },
            { date: "2029-08-09", name: "National Women's Day" },
            { date: "2029-09-24", name: "Heritage Day" },
            { date: "2029-12-16", name: "Day of Reconciliation" },
            { date: "2029-12-17", name: "Day of Reconciliation Observed", observed: true },
            { date: "2029-12-25", name: "Christmas Day" },
            { date: "2029-12-26", name: "Day of Goodwill" },
        ],
    },
    {
        year: 2030,
        source: "statutory-derived",
        sourceLabel: "Derived from the Public Holidays Act rules plus pinned Easter fixtures; not an official yearly published list.",
        fixtures: [
            { date: "2030-01-01", name: "New Year's Day" },
            { date: "2030-03-21", name: "Human Rights Day" },
            { date: "2030-04-19", name: "Good Friday" },
            { date: "2030-04-22", name: "Family Day" },
            { date: "2030-04-27", name: "Freedom Day" },
            { date: "2030-05-01", name: "Workers' Day" },
            { date: "2030-06-16", name: "Youth Day" },
            { date: "2030-06-17", name: "Youth Day Observed", observed: true },
            { date: "2030-08-09", name: "National Women's Day" },
            { date: "2030-09-24", name: "Heritage Day" },
            { date: "2030-12-16", name: "Day of Reconciliation" },
            { date: "2030-12-25", name: "Christmas Day" },
            { date: "2030-12-26", name: "Day of Goodwill" },
        ],
    },
];

const WEEKDAY_TO_PATTERN_KEY: Record<number, keyof OrdinaryWorkPattern> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
};

export interface OrdinaryWorkCalendarSummary {
    startDate: string;
    endDate: string;
    workPattern: OrdinaryWorkPattern;
    publicHolidaysInRange: PublicHoliday[];
    publicHolidaysOnOrdinaryWorkDays: PublicHoliday[];
    ordinaryWorkDates: string[];
    excludedHolidayDates: string[];
    ordinaryDayCap: number;
    ordinaryHourCap: number;
    explanation: string;
}

function assertSupportedYear(year: number) {
    if (!PAYROLL_HOLIDAY_FIXTURES.some((entry) => entry.year === year)) {
        throw new Error(`South African public holiday fixtures are only pinned for 2026-2030. Received ${year}.`);
    }
}

export function getSouthAfricanPublicHolidaysForYear(year: number): PublicHoliday[] {
    assertSupportedYear(year);
    const fixtureYear = PAYROLL_HOLIDAY_FIXTURES.find((entry) => entry.year === year);
    if (!fixtureYear) return [];

    return fixtureYear.fixtures.map((fixture) => ({
        date: fixture.date,
        name: fixture.name,
        observed: fixture.observed ?? false,
        source: fixtureYear.source,
        sourceLabel: fixtureYear.sourceLabel,
    }));
}

export function getSouthAfricanPublicHolidaysInRange(start: Date | string, end: Date | string): PublicHoliday[] {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const rangeStart = toIsoDate(startDate);
    const rangeEnd = toIsoDate(endDate);
    const holidays: PublicHoliday[] = [];

    for (let year = startYear; year <= endYear; year += 1) {
        holidays.push(
            ...getSouthAfricanPublicHolidaysForYear(year).filter((holiday) => holiday.date >= rangeStart && holiday.date <= rangeEnd),
        );
    }

    return holidays;
}

function formatHolidayCountLabel(count: number): string {
    return `${count} South African public holiday${count === 1 ? "" : "s"}`;
}

export function describeOrdinaryWorkCalendar(
    start: Date | string,
    end: Date | string,
    workPattern: OrdinaryWorkPattern | null | undefined,
    ordinaryHoursPerDay: number,
): OrdinaryWorkCalendarSummary {
    const normalizedPattern = workPattern ?? buildEmptyOrdinaryWorkPattern();
    const startDate = new Date(start);
    const endDate = new Date(end);
    const holidaysInRange = getSouthAfricanPublicHolidaysInRange(startDate, endDate);
    const holidayLookup = new Map(holidaysInRange.map((holiday) => [holiday.date, holiday]));
    const ordinaryWorkDates: string[] = [];
    const excludedHolidayDates: string[] = [];
    const publicHolidaysOnOrdinaryWorkDays: PublicHoliday[] = [];
    let cursor = new Date(startDate);

    while (cursor <= endDate) {
        const dateKey = toIsoDate(cursor);
        const weekdayKey = WEEKDAY_TO_PATTERN_KEY[cursor.getDay()];
        const isOrdinaryWorkday = normalizedPattern[weekdayKey];
        const holiday = holidayLookup.get(dateKey);

        if (isOrdinaryWorkday && holiday) {
            excludedHolidayDates.push(dateKey);
            publicHolidaysOnOrdinaryWorkDays.push(holiday);
        } else if (isOrdinaryWorkday) {
            ordinaryWorkDates.push(dateKey);
        }

        cursor = addDays(cursor, 1);
    }

    const ordinaryDayCap = ordinaryWorkDates.length;
    const safeOrdinaryHoursPerDay = Math.max(0, ordinaryHoursPerDay);
    const ordinaryHourCap = ordinaryDayCap * safeOrdinaryHoursPerDay;
    const selectedPatternDays = ORDINARY_WORK_PATTERN_KEYS.filter((key) => normalizedPattern[key]).length;
    const explanation = selectedPatternDays === 0
        ? "No ordinary work pattern is confirmed yet, so ordinary-day and ordinary-hour caps stay at 0 until the schedule is confirmed."
        : `${ordinaryDayCap} ordinary day${ordinaryDayCap === 1 ? "" : "s"} are allowed in this range because the selected work pattern applies on ${selectedPatternDays} weekday${selectedPatternDays === 1 ? "" : "s"} per week, and ${formatHolidayCountLabel(publicHolidaysOnOrdinaryWorkDays.length)} on that pattern ${publicHolidaysOnOrdinaryWorkDays.length === 1 ? "is" : "are"} excluded from ordinary time. At ${safeOrdinaryHoursPerDay} hour${safeOrdinaryHoursPerDay === 1 ? "" : "s"} per ordinary day, the cap is ${ordinaryHourCap} ordinary hour${ordinaryHourCap === 1 ? "" : "s"}.`;

    return {
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        workPattern: normalizedPattern,
        publicHolidaysInRange: holidaysInRange,
        publicHolidaysOnOrdinaryWorkDays,
        ordinaryWorkDates,
        excludedHolidayDates,
        ordinaryDayCap,
        ordinaryHourCap,
        explanation,
    };
}
