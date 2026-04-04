"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
    buildOrdinaryWorkCalendarPlainLanguage,
    type OrdinaryWorkCalendarSummary,
} from "@/lib/payroll-calendar";

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
    const [showHolidayDetails, setShowHolidayDetails] = React.useState(false);
    const plainLanguage = React.useMemo(
        () => buildOrdinaryWorkCalendarPlainLanguage(summary, ordinaryHoursPerDay),
        [ordinaryHoursPerDay, summary],
    );

    return (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{title}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{plainLanguage.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="Maximum normal days" value={`${summary.ordinaryDayCap} day${summary.ordinaryDayCap === 1 ? "" : "s"}`} />
                <Metric label="Maximum normal hours" value={`${summary.ordinaryHourCap}h`} />
            </div>
            <div className="mt-5 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <button
                    type="button"
                    onClick={() => setShowHolidayDetails((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                >
                    <div>
                        <p className="text-sm font-semibold text-[var(--text)]">Public holiday check</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{plainLanguage.holidayDetails}</p>
                    </div>
                    {showHolidayDetails ? (
                        <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                </button>
                {showHolidayDetails ? (
                    summary.publicHolidaysInRange.length === 0 ? (
                        <p className="mt-3 text-sm text-[var(--text-muted)]">No South African public holidays fall in this month.</p>
                    ) : (
                        <ul className="mt-3 space-y-2 text-sm text-[var(--text)]">
                            {summary.publicHolidaysInRange.map((holiday) => {
                                const excluded = summary.excludedHolidayDates.includes(holiday.date);
                                return (
                                    <li key={holiday.date}>
                                        {format(new Date(`${holiday.date}T00:00:00`), "EEE d MMM yyyy")} · {holiday.name} · {excluded ? "removed from normal days" : "not part of this usual work week"}
                                    </li>
                                );
                            })}
                        </ul>
                    )
                ) : null}
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
