import { describe, expect, it } from "vitest";
import { describeOrdinaryWorkCalendar, getSouthAfricanPublicHolidaysForYear } from "./payroll-calendar";

const mondayToFriday = {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
} as const;

const mondayToSaturday = {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
} as const;

describe("South African payroll calendar", () => {
    it("returns pinned South African public holidays for each supported year with provenance", () => {
        const byYear = [2026, 2027, 2028, 2029, 2030].map((year) => ({
            year,
            holidays: getSouthAfricanPublicHolidaysForYear(year),
        }));

        expect(byYear.find((entry) => entry.year === 2026)?.holidays).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ date: "2026-04-03", name: "Good Friday", source: "official-published" }),
                expect.objectContaining({ date: "2026-04-06", name: "Family Day", source: "official-published" }),
                expect.objectContaining({ date: "2026-04-27", name: "Freedom Day", source: "official-published" }),
            ]),
        );
        expect(byYear.find((entry) => entry.year === 2029)?.holidays).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ date: "2029-03-30", source: "statutory-derived" }),
            ]),
        );
        expect(byYear.find((entry) => entry.year === 2030)?.holidays).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ date: "2030-04-19", source: "statutory-derived" }),
            ]),
        );
    });

    it("excludes public holidays from the ordinary day and ordinary hour cap", () => {
        const summary = describeOrdinaryWorkCalendar(
            new Date("2026-04-01T00:00:00.000Z"),
            new Date("2026-04-30T00:00:00.000Z"),
            mondayToFriday,
            8,
        );

        expect(summary.publicHolidaysInRange.map((holiday) => holiday.date)).toEqual(
            expect.arrayContaining(["2026-04-03", "2026-04-06", "2026-04-27"]),
        );
        expect(summary.excludedHolidayDates).toEqual(expect.arrayContaining(["2026-04-03", "2026-04-06", "2026-04-27"]));
        expect(summary.ordinaryDayCap).toBe(19);
        expect(summary.ordinaryHourCap).toBe(152);
    });

    it("counts Saturday schedules correctly when a public holiday does not fall on Saturday", () => {
        const summary = describeOrdinaryWorkCalendar(
            new Date("2026-06-01T00:00:00.000Z"),
            new Date("2026-06-30T00:00:00.000Z"),
            mondayToSaturday,
            8,
        );

        expect(summary.publicHolidaysInRange.map((holiday) => holiday.date)).toEqual(["2026-06-16"]);
        expect(summary.ordinaryDayCap).toBe(25);
        expect(summary.ordinaryHourCap).toBe(200);
    });
});
