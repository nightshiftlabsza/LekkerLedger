"use client";

import * as React from "react";
import { format } from "date-fns";
import type { OrdinaryWorkCalendarSummary } from "@/lib/payroll-calendar";

interface OrdinaryWorkCalendarSummaryCardProps {
    summary: OrdinaryWorkCalendarSummary;
    ordinaryHoursPerDay: number;
    title?: string;
}

export function OrdinaryWorkCalendarSummaryCard({
    summary,
    ordinaryHoursPerDay,
    title = "Ordinary work cap",
}: OrdinaryWorkCalendarSummaryCardProps) {
    const selectedPatternDays = Object.values(summary.workPattern).filter(Boolean).length;
    const publicHolidayIntro = selectedPatternDays === 0
        ? "Select the ordinary work pattern to calculate the monthly cap."
        : summary.publicHolidaysOnOrdinaryWorkDays.length > 0
            ? `${summary.ordinaryDayCap} ordinary days remain after excluding ${summary.publicHolidaysOnOrdinaryWorkDays.length} public holiday${summary.publicHolidaysOnOrdinaryWorkDays.length === 1 ? "" : "s"} that fall on the ordinary pattern.`
            : `${summary.ordinaryDayCap} ordinary days fall on the selected work pattern in this month.`;

    return (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{title}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{publicHolidayIntro}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Ordinary day cap" value={`${summary.ordinaryDayCap} day${summary.ordinaryDayCap === 1 ? "" : "s"}`} />
                <Metric label="Ordinary hours per day" value={`${ordinaryHoursPerDay}h`} />
                <Metric label="Ordinary hour cap" value={`${summary.ordinaryHourCap}h`} />
            </div>
            <div className="mt-5 space-y-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">South African public holidays in range</p>
                    {summary.publicHolidaysInRange.length === 0 ? (
                        <p className="mt-2 text-sm text-[var(--text-muted)]">No South African public holidays fall in this month.</p>
                    ) : (
                        <ul className="mt-2 space-y-2 text-sm text-[var(--text)]">
                            {summary.publicHolidaysInRange.map((holiday) => {
                                const excluded = summary.excludedHolidayDates.includes(holiday.date);
                                return (
                                    <li key={holiday.date}>
                                        {format(new Date(`${holiday.date}T00:00:00`), "EEE d MMM yyyy")} · {holiday.name} · {excluded ? "excluded from ordinary hours" : "not on the ordinary pattern"}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-lg font-bold text-[var(--text)]">{value}</p>
        </div>
    );
}
